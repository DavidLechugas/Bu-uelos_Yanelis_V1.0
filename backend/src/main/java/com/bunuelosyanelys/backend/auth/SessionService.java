package com.bunuelosyanelys.backend.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

@Service
public class SessionService {

    private final SecureRandom random = new SecureRandom();
    private final AuthSessionRepository sessions;
    private final AppUserRepository users;
    private final AuthProperties properties;
    private final Clock clock;

    public SessionService(AuthSessionRepository sessions, AppUserRepository users,
            AuthProperties properties, Clock clock) {
        this.sessions = sessions;
        this.users = users;
        this.properties = properties;
        this.clock = clock;
    }

    public String create(String userId) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant now = clock.instant();
        sessions.save(new AuthSession(hash(token), userId, now, now.plus(properties.sessionDuration())));
        return token;
    }

    public Optional<AuthUser> resolve(String token) {
        if (token == null || token.isBlank() || token.length() > 100) {
            return Optional.empty();
        }
        return sessions.findById(hash(token))
                .filter(session -> session.getExpiraEn().isAfter(clock.instant()))
                .flatMap(session -> users.findById(session.getUserId()))
                .filter(AppUser::isActivo)
                .map(AuthUser::of);
    }

    public void revoke(String token) {
        if (token != null && !token.isBlank()) {
            sessions.deleteById(hash(token));
        }
    }

    public void revokeAll(String userId) {
        sessions.deleteByUserId(userId);
    }

    public ResponseCookie cookie(String token) {
        return baseCookie(token).maxAge(properties.sessionDuration()).build();
    }

    public ResponseCookie clearedCookie() {
        return baseCookie("").maxAge(0).build();
    }

    private ResponseCookie.ResponseCookieBuilder baseCookie(String value) {
        // Sin Domain: la cookie queda ligada al dominio del Worker, vía el proxy del mismo origen.
        return ResponseCookie.from(AuthProperties.SESSION_COOKIE, value)
                .httpOnly(true)
                .secure(properties.cookieSecure())
                .sameSite("Lax")
                .path("/");
    }

    static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
