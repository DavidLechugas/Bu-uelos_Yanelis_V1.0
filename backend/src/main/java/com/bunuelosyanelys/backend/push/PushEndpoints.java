package com.bunuelosyanelys.backend.push;

import java.net.URI;
import java.util.List;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import com.bunuelosyanelys.backend.common.ApiException;

/** Servicios push de los navegadores: el servidor solo hace POST a estos hosts (evita SSRF). */
@Component
class PushEndpoints {

    private static final List<String> PUSH_HOSTS = List.of(
            "fcm.googleapis.com", ".push.services.mozilla.com", ".push.apple.com", ".notify.windows.com");

    /** Hosts extra sin restricción de esquema ni puerto; vacío en producción, solo para pruebas. */
    private final List<String> extraHosts;

    PushEndpoints(@Value("${app.push.extra-hosts:}") List<String> extraHosts) {
        this.extraHosts = extraHosts.stream().map(String::trim).filter(host -> !host.isEmpty()).toList();
    }

    void require(String endpoint) {
        String host = "";
        boolean standard = false;
        try {
            URI uri = URI.create(endpoint);
            if (uri.getRawUserInfo() == null && uri.getHost() != null) {
                host = uri.getHost().toLowerCase(Locale.ROOT);
                standard = "https".equals(uri.getScheme()) && uri.getPort() == -1;
            }
        } catch (IllegalArgumentException invalid) {
            // host vacío: se rechaza abajo
        }
        String candidate = host;
        boolean allowed = extraHosts.contains(candidate)
                || (standard && PUSH_HOSTS.stream().anyMatch(allowedHost ->
                        allowedHost.startsWith(".") ? candidate.endsWith(allowedHost) : candidate.equals(allowedHost)));
        if (!allowed) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Servicio de notificaciones no permitido.");
        }
    }
}
