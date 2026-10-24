package com.bunuelosyanelys.backend.push;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/** Suscripción push de un dispositivo; el id es el SHA-256 del endpoint, así cada dispositivo guarda una sola. */
@Document("push_subscriptions")
public class StoredSubscription {

    @Id
    private String id;
    @Indexed
    private String userId;
    private String endpoint;
    private String p256dh;
    private String auth;
    private Instant creadoEn;

    public StoredSubscription() {
    }

    public StoredSubscription(String id, String userId, String endpoint, String p256dh, String auth, Instant creadoEn) {
        this.id = id;
        this.userId = userId;
        this.endpoint = endpoint;
        this.p256dh = p256dh;
        this.auth = auth;
        this.creadoEn = creadoEn;
    }

    public String getId() {
        return id;
    }

    public String getUserId() {
        return userId;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public String getP256dh() {
        return p256dh;
    }

    public String getAuth() {
        return auth;
    }

    public Instant getCreadoEn() {
        return creadoEn;
    }
}
