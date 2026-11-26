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
import com.bunuelosyanelys.backend.common.ApiException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Suscripciones push del dispositivo de quien tiene la sesión abierta. */
@RestController
@RequestMapping("/api/push")
public class PushController {

    static final int MAX_PER_USER = 5;

    public record Keys(@NotBlank @Size(max = 200) String p256dh, @NotBlank @Size(max = 100) String auth) {
    }

    public record SubscribeRequest(@NotBlank @Size(max = 600) String endpoint, @NotNull @Valid Keys keys) {
    }

    public record UnsubscribeRequest(@NotBlank @Size(max = 600) String endpoint) {
    }

    private final StoredSubscriptionRepository subscriptions;
    private final PushEndpoints endpoints;
    private final VapidKeys keys;
    private final Clock clock;

    public PushController(StoredSubscriptionRepository subscriptions, PushEndpoints endpoints, VapidKeys keys,
            Clock clock) {
        this.subscriptions = subscriptions;
        this.endpoints = endpoints;
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
        endpoints.require(request.endpoint());
        String id = id(request.endpoint());
        boolean known = subscriptions.findById(id).filter(stored -> user.id().equals(stored.getUserId())).isPresent();
        if (!known && subscriptions.countByUserId(user.id()) >= MAX_PER_USER) {
            throw new ApiException(HttpStatus.CONFLICT, "Ya tienes demasiados dispositivos con avisos activos.");
        }
        subscriptions.save(new StoredSubscription(id, user.id(), request.endpoint(),
                request.keys().p256dh(), request.keys().auth(), clock.instant()));
    }

    @PostMapping("/unsubscribe")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsubscribe(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody UnsubscribeRequest request) {
        subscriptions.deleteByIdAndUserId(id(request.endpoint()), user.id());
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
