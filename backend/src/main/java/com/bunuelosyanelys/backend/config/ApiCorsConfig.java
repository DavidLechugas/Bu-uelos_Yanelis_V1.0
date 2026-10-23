package com.bunuelosyanelys.backend.config;

import java.net.URI;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** CORS fail closed: solo se habilita con {@code FRONTEND_ORIGIN} (origen exacto, nunca {@code *}) y únicamente para la API. */
@Configuration
public class ApiCorsConfig implements WebMvcConfigurer {

    static final String API_PATH = "/api/**";

    private final String frontendOrigin;

    public ApiCorsConfig(
            @Value("${FRONTEND_ORIGIN:}") String frontendOrigin) {
        this.frontendOrigin =
                (frontendOrigin == null) ? "" : frontendOrigin.trim();
        if (!this.frontendOrigin.isEmpty()) {
            URI origin = URI.create(this.frontendOrigin);
            if (!"https".equals(origin.getScheme()) || origin.getHost() == null
                    || this.frontendOrigin.contains("*") || origin.getRawUserInfo() != null
                    || !origin.getRawPath().isEmpty() || origin.getRawQuery() != null
                    || origin.getRawFragment() != null) {
                throw new IllegalArgumentException(
                        "FRONTEND_ORIGIN debe ser un origen HTTPS exacto, sin ruta ni comodines");
            }
        }
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        if (frontendOrigin.isEmpty()) {
            return;
        }
        registry.addMapping(API_PATH)
                .allowedOrigins(frontendOrigin)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "OPTIONS")
                .allowCredentials(false)
                .maxAge(3600);
    }

    /** Verdadero solo cuando hay un origen de frontend configurado. */
    public boolean isCorsEnabled() {
        return !frontendOrigin.isEmpty();
    }
}
