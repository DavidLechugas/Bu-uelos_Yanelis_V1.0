package com.bunuelosyanelys.backend.auth;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** El id es el SHA-256 del token de la cookie; expira por índice TTL sobre {@code expiraEn}. */
@Document("auth_sessions")
public class AuthSession {

    @Id
    private String id;
    private String userId;
    private Instant creadaEn;
    private Instant expiraEn;

    public AuthSession() {
    }

    public AuthSession(String id, String userId, Instant creadaEn, Instant expiraEn) {
        this.id = id;
        this.userId = userId;
        this.creadaEn = creadaEn;
        this.expiraEn = expiraEn;
    }

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public Instant getCreadaEn() { return creadaEn; }
    public Instant getExpiraEn() { return expiraEn; }
}
