package com.bunuelosyanelys.backend.push;

import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.bunuelosyanelys.backend.auth.AppUser;
import com.bunuelosyanelys.backend.auth.AppUserRepository;
import com.bunuelosyanelys.backend.auth.Role;

import nl.martijndwars.webpush.Encoding;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;

/** Envía notificaciones push sin bloquear la petición; las suscripciones caducadas se borran solas. */
@Service
public class PushNotifier {

    private static final Logger log = LoggerFactory.getLogger(PushNotifier.class);
    private static final int TTL_SECONDS = 600;

    private final StoredSubscriptionRepository subscriptions;
    private final AppUserRepository users;
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
    private final PushService service;

    PushNotifier(StoredSubscriptionRepository subscriptions, AppUserRepository users, VapidKeys keys,
            @Value("${VAPID_SUBJECT:https://bu-uelos-yanelis-v1-0.davidinternet224.workers.dev}") String subject)
            throws Exception {
        this.subscriptions = subscriptions;
        this.users = users;
        this.service = new PushService(keys.publicKey(), keys.privateKey(), subject);
    }

    public void toUser(String userId, String title, String body, String tag) {
        if (userId != null) {
            toUsers(List.of(userId), title, body, tag);
        }
    }

    public void toAdmins(String title, String body, String tag) {
        toUsers(activeIds(Role.ADMIN), title, body, tag);
    }

    public void toCouriers(String title, String body, String tag) {
        toUsers(activeIds(Role.COURIER), title, body, tag);
    }

    private List<String> activeIds(Role role) {
        return users.findByRoleOrderByNombreAsc(role).stream().filter(AppUser::isActivo).map(AppUser::getId).toList();
    }

    private void toUsers(Collection<String> userIds, String title, String body, String tag) {
        if (userIds.isEmpty()) {
            return;
        }
        byte[] payload = payload(title, body, tag).getBytes(StandardCharsets.UTF_8);
        executor.submit(() -> {
            for (StoredSubscription subscription : subscriptions.findByUserIdIn(userIds)) {
                send(subscription, payload);
            }
        });
    }

    private void send(StoredSubscription subscription, byte[] payload) {
        try {
            int status = service.send(new Notification(subscription.getEndpoint(), subscription.getP256dh(),
                    subscription.getAuth(), payload, TTL_SECONDS), Encoding.AES128GCM).getStatusLine().getStatusCode();
            if (status == 404 || status == 410) {
                subscriptions.deleteById(subscription.getId());
            } else if (status >= 400) {
                log.warn("Push rechazado con estado {}", status);
            }
        } catch (Exception error) {
            log.warn("No se pudo enviar una notificación push: {}", error.toString());
        }
    }

    static String payload(String title, String body, String tag) {
        return "{\"title\":" + quote(title) + ",\"body\":" + quote(body) + ",\"tag\":" + quote(tag) + "}";
    }

    private static String quote(String text) {
        StringBuilder out = new StringBuilder("\"");
        for (char c : text.toCharArray()) {
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                default -> out.append(c < 0x20 ? String.format("\\u%04x", (int) c) : String.valueOf(c));
            }
        }
        return out.append('"').toString();
    }
}
