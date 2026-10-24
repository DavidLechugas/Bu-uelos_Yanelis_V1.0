package com.bunuelosyanelys.backend.push;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.util.HexFormat;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.bunuelosyanelys.backend.auth.AuthUser;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Suscripciones push del dispositivo de quien tiene la sesión abierta. */
@RestController
@RequestMapping("/api/push")
public class PushController {

    public record Keys(@NotBlank @Size(max = 200) String p256dh, @NotBlank @Size(max = 100) String auth) {
    }

    public record SubscribeRequest(@NotBlank @Size(max = 600) String endpoint, @NotNull @Valid Keys keys) {
    }

    public record UnsubscribeRequest(@NotBlank @Size(max = 600) String endpoint) {
    }

    private final StoredSubscriptionRepository subscriptions;
    private final VapidKeys keys;
    private final Clock clock;

    public PushController(StoredSubscriptionRepository subscriptions, VapidKeys keys, Clock clock) {
        this.subscriptions = subscriptions;
        this.keys = keys;
        this.clock = clock;
    }

    @GetMapping("/key")
    public Map<String, String> key() {
        return Map.of("publicKey", keys.publicKey());
    }

    @PostMapping("/subscribe")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void subscribe(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody SubscribeRequest request) {
        subscriptions.save(new StoredSubscription(id(request.endpoint()), user.id(), request.endpoint(),
                request.keys().p256dh(), request.keys().auth(), clock.instant()));
    }

    @PostMapping("/unsubscribe")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsubscribe(@Valid @RequestBody UnsubscribeRequest request) {
        subscriptions.deleteById(id(request.endpoint()));
    }

    private static String id(String endpoint) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(endpoint.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException(error);
        }
    }
}
