package com.bunuelosyanelys.backend.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Bloquea un nombre de usuario durante 15 minutos tras 5 intentos
 * fallidos. Se aplica a cualquier nombre, exista o no, para no
 * revelar qué cuentas existen. En memoria: hay una sola instancia.
 */
@Component
public class LoginAttemptLimiter {

    static final int MAX_FAILURES = 5;
    static final Duration LOCK = Duration.ofMinutes(15);

    private record Attempts(int failures, Instant lockedUntil) {
    }

    private final Map<String, Attempts> attempts = new ConcurrentHashMap<>();
    private final Clock clock;

    public LoginAttemptLimiter(Clock clock) {
        this.clock = clock;
    }

    public boolean isLocked(String username) {
        Attempts current = attempts.get(username);
        return current != null && current.lockedUntil() != null
                && current.lockedUntil().isAfter(clock.instant());
    }

    public void failure(String username) {
        attempts.compute(username, (key, current) -> {
            int failures = (current == null || current.lockedUntil() != null) ? 1 : current.failures() + 1;
            return failures >= MAX_FAILURES
                    ? new Attempts(failures, clock.instant().plus(LOCK))
                    : new Attempts(failures, null);
        });
    }

    public void success(String username) {
        attempts.remove(username);
    }
}
