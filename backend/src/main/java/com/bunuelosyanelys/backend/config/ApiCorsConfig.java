package com.bunuelosyanelys.backend.config;

import java.net.URI;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS para la API de demostración desplegada (el frontend
 * en Cloudflare Pages y la API en Render son orígenes
 * distintos, y el navegador exige CORS).
 *
 * <p>Fail closed: CORS solo se habilita cuando existe la
 * variable de entorno {@code FRONTEND_ORIGIN} con el origen
 * EXACTO del frontend (por ejemplo
 * {@code https://bunuelos-yanelys.pages.dev}, sin barra
 * final):
 * <ul>
 *   <li>Nunca se usa el comodín {@code *}.</li>
 *   <li>{@code allowCredentials} es {@code false} (por
 *       defecto y de forma explícita).</li>
 *   <li>Solo {@code GET} (y su preflight {@code OPTIONS}):
 *       la API de demostración es de solo lectura.</li>
 * </ul>
 *
 * <p>En dev el proxy de Vite sirve {@code /api} en el mismo
 * origen, así que esta configuración permanece inactiva
 * (sin {@code FRONTEND_ORIGIN} no se registra ningún
 * mapeo CORS).
 */
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
            // Fail closed: sin origen configurado, ningún
            // origen cruzado está permitido.
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
