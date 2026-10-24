package com.bunuelosyanelys.backend.push;

import java.math.BigInteger;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Security;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.jce.interfaces.ECPrivateKey;
import org.bouncycastle.jce.interfaces.ECPublicKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.stereotype.Component;

/**
 * Claves VAPID del servidor. Se toman de VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY si existen; si no, se
 * generan una vez y se guardan en MongoDB para que las suscripciones sigan valiendo tras cada arranque.
 */
@Component
public class VapidKeys {

    @Document("push_config")
    static class Stored {
        @Id
        String id = "vapid";
        String publicKey;
        String privateKey;
    }

    private final String publicKey;
    private final String privateKey;

    VapidKeys(MongoTemplate mongo, @Value("${VAPID_PUBLIC_KEY:}") String publicKey,
            @Value("${VAPID_PRIVATE_KEY:}") String privateKey) throws Exception {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
        if (!publicKey.isBlank() && !privateKey.isBlank()) {
            this.publicKey = publicKey.trim();
            this.privateKey = privateKey.trim();
            return;
        }
        Stored stored = mongo.findById("vapid", Stored.class);
        if (stored == null) {
            stored = generate();
            mongo.save(stored);
        }
        this.publicKey = stored.publicKey;
        this.privateKey = stored.privateKey;
    }

    public String publicKey() {
        return publicKey;
    }

    String privateKey() {
        return privateKey;
    }

    private static Stored generate() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("ECDH", BouncyCastleProvider.PROVIDER_NAME);
        generator.initialize(new ECGenParameterSpec("secp256r1"));
        KeyPair pair = generator.generateKeyPair();
        Stored stored = new Stored();
        stored.publicKey = base64Url(((ECPublicKey) pair.getPublic()).getQ().getEncoded(false));
        stored.privateKey = base64Url(unsigned32(((ECPrivateKey) pair.getPrivate()).getD()));
        return stored;
    }

    private static byte[] unsigned32(BigInteger value) {
        byte[] bytes = value.toByteArray();
        byte[] out = new byte[32];
        int length = Math.min(bytes.length, 32);
        System.arraycopy(bytes, bytes.length - length, out, 32 - length, length);
        return out;
    }

    private static String base64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
