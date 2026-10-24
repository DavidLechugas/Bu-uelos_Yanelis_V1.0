package com.bunuelosyanelys.backend.push;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.net.InetSocketAddress;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.SecureRandom;
import java.security.Security;
import java.security.spec.ECGenParameterSpec;
import java.time.Instant;
import java.util.Base64;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import org.bouncycastle.jce.interfaces.ECPublicKey;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import com.bunuelosyanelys.backend.auth.ApiTestSupport;
import com.bunuelosyanelys.backend.auth.AppUser;
import com.bunuelosyanelys.backend.auth.Role;
import com.sun.net.httpserver.HttpServer;

/** Comprueba de punta a punta que un pedido nuevo genera un push cifrado y firmado hacia el dispositivo. */
class PushDeliveryTest extends ApiTestSupport {

    record Received(String authorization, String cryptoKey, String encoding, String ttl, int bodyLength) {
    }

    @Autowired
    private StoredSubscriptionRepository subscriptions;

    private HttpServer server;
    private final BlockingQueue<Received> received = new LinkedBlockingQueue<>();
    private AppUser luis;

    @BeforeEach
    void setUp() throws Exception {
        createUser("admin", "Yanelys", Role.ADMIN, true);
        luis = createUser("luis", "Luis", Role.COURIER, true);
        subscriptions.deleteAll();
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/push", exchange -> {
            byte[] body = exchange.getRequestBody().readAllBytes();
            received.add(new Received(exchange.getRequestHeaders().getFirst("Authorization"),
                    exchange.getRequestHeaders().getFirst("Crypto-Key"),
                    exchange.getRequestHeaders().getFirst("Content-Encoding"),
                    exchange.getRequestHeaders().getFirst("TTL"), body.length));
            exchange.sendResponseHeaders(201, -1);
            exchange.close();
        });
        server.start();
    }

    @AfterEach
    void tearDown() {
        server.stop(0);
        subscriptions.deleteAll();
    }

    @Test
    void unPedidoDisponibleLlegaCifradoYFirmadoAlDomiciliarioSuscrito() throws Exception {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
        KeyPairGenerator generator = KeyPairGenerator.getInstance("ECDH", BouncyCastleProvider.PROVIDER_NAME);
        generator.initialize(new ECGenParameterSpec("secp256r1"));
        KeyPair device = generator.generateKeyPair();
        byte[] auth = new byte[16];
        new SecureRandom().nextBytes(auth);
        Base64.Encoder url = Base64.getUrlEncoder().withoutPadding();
        subscriptions.save(new StoredSubscription("device-1", luis.getId(),
                "http://127.0.0.1:" + server.getAddress().getPort() + "/push",
                url.encodeToString(((ECPublicKey) device.getPublic()).getQ().getEncoded(false)),
                url.encodeToString(auth), Instant.now()));

        mvc.perform(login("admin").with(post("/api/orders")).contentType(MediaType.APPLICATION_JSON)
                .content(json("cliente", "Carmen", "telefono", "3001112233", "direccion", "Cra 5 #10-20",
                        "detalle", "12 buñuelos", "totalCop", 24000)))
                .andExpect(status().isCreated());

        Received push = received.poll(10, TimeUnit.SECONDS);
        assertNotNull(push, "el dispositivo no recibió ninguna notificación");
        assertTrue(push.authorization().startsWith("WebPush ") || push.authorization().startsWith("vapid "), push.authorization());
                assertEquals("aes128gcm", push.encoding());
        assertEquals("600", push.ttl());
        assertTrue(push.bodyLength() > 100);
    }
}
