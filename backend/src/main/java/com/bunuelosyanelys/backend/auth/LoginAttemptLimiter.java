package com.bunuelosyanelys.backend.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Frena la adivinación de contraseñas, exista o no la cuenta. En memoria, con dos contadores:
 * por usuario y origen (5 fallos bloquean 15 minutos solo a ese origen, así un tercero no deja fuera
 * al dueño de la cuenta) y por usuario en total (50 fallos desde cualquier origen).
 */
@Component
public class LoginAttemptLimiter {

    static final int MAX_FAILURES = 5;
    static final int MAX_FAILURES_PER_USER = 50;
    static final Duration LOCK = Duration.ofMinutes(15);
    /** Tope de contadores recordados: evita que usuarios inventados llenen la memoria. */
    static final int MAX_TRACKED = 10_000;

    private record Attempts(int failures, Instant lockedUntil, Instant lastFailure) {
    }

    private final Map<String, Attempts> attempts = new ConcurrentHashMap<>();
    private final Clock clock;

    public LoginAttemptLimiter(Clock clock) {
        this.clock = clock;
    }

    public boolean isLocked(String username, String origin) {
        return locked(pairKey(username, origin)) || locked(userKey(username));
    }

    public void failure(String username, String origin) {
        record(pairKey(username, origin), MAX_FAILURES);
        record(userKey(username), MAX_FAILURES_PER_USER);
    }

    public void success(String username, String origin) {
        attempts.remove(pairKey(username, origin));
    }

    private boolean locked(String key) {
        Attempts current = attempts.get(key);
        return current != null && current.lockedUntil() != null
                && current.lockedUntil().isAfter(clock.instant());
    }

    private void record(String key, int max) {
        Instant now = clock.instant();
        if (attempts.size() >= MAX_TRACKED) {
            // Lleno: se descartan los contadores sin bloqueo (los bloqueos vigentes se conservan), nunca se deja de contar.
            attempts.values().removeIf(entry -> entry.lockedUntil() == null || !entry.lockedUntil().isAfter(now));
        }
        attempts.compute(key, (name, current) -> {
            boolean fresh = current == null || current.lastFailure().plus(LOCK).isBefore(now)
                    || (current.lockedUntil() != null && !current.lockedUntil().isAfter(now));
            int failures = fresh ? 1 : current.failures() + 1;
            return failures >= max
                    ? new Attempts(failures, now.plus(LOCK), now)
                    : new Attempts(failures, null, now);
        });
    }

    private static String pairKey(String username, String origin) {
        return "u:" + username + "|" + origin;
    }

    private static String userKey(String username) {
        return "u:" + username;
    }
}
