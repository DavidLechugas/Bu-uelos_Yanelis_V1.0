package com.bunuelosyanelys.backend.auth;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bunuelosyanelys.backend.common.ApiException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Inicio y cierre de sesión. Sin registro público. */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    static final String INVALID_CREDENTIALS = "Usuario o contraseña incorrectos.";

    public record LoginRequest(
            @NotBlank(message = "Escribe tu usuario.") @Size(max = 100) String usuario,
            @NotBlank(message = "Escribe tu contraseña.") @Size(max = 200) String password) {
    }

    private final AppUserRepository users;
    private final PasswordEncoder encoder;
    private final SessionService sessions;
    private final LoginAttemptLimiter limiter;
    /** Hash de relleno: igual coste de verificación exista o no el usuario. */
    private final String dummyHash;

    public AuthController(AppUserRepository users, PasswordEncoder encoder, SessionService sessions,
            LoginAttemptLimiter limiter) {
        this.users = users;
        this.encoder = encoder;
        this.sessions = sessions;
        this.limiter = limiter;
        this.dummyHash = encoder.encode("contraseña-de-relleno");
    }

    @GetMapping("/session")
    public Map<String, Object> session(@AuthenticationPrincipal AuthUser user) {
        Map<String, Object> body = new HashMap<>();
        body.put("usuario", user);
        return body;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request,
            @CookieValue(name = AuthProperties.SESSION_COOKIE, required = false) String previousToken) {
        String username = Credentials.normalizeUsername(request.usuario());
        if (limiter.isLocked(username)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo.");
        }
        Optional<AppUser> found = users.findByUsername(username);
        boolean matches = encoder.matches(request.password(),
                found.map(AppUser::getPasswordHash).orElse(dummyHash));
        if (found.isEmpty() || !matches || !found.get().isActivo()) {
            limiter.failure(username);
            throw new ApiException(HttpStatus.UNAUTHORIZED, INVALID_CREDENTIALS);
        }
        limiter.success(username);
        sessions.revoke(previousToken);
        String token = sessions.create(found.get().getId());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, sessions.cookie(token).toString())
                .body(Map.of("usuario", AuthUser.of(found.get())));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = AuthProperties.SESSION_COOKIE, required = false) String token) {
        sessions.revoke(token);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, sessions.clearedCookie().toString())
                .build();
    }
}
