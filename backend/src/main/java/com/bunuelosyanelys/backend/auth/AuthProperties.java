package com.bunuelosyanelys.backend.auth;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * {@code app.auth.*}. La cookie es Secure por defecto; solo el perfil
 * dev la desactiva para http://localhost.
 */
@ConfigurationProperties("app.auth")
public record AuthProperties(Boolean cookieSecure, Duration sessionDuration) {

    public static final String SESSION_COOKIE = "by_session";

    public AuthProperties {
        cookieSecure = cookieSecure == null ? Boolean.TRUE : cookieSecure;
        sessionDuration = sessionDuration == null ? Duration.ofDays(7) : sessionDuration;
    }
}
