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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bunuelosyanelys.backend.common.ApiException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

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
    private final PrincipalAdmin principal;
    /** Hash de relleno: igual coste de verificación exista o no el usuario. */
    private final String dummyHash;

    public AuthController(AppUserRepository users, PasswordEncoder encoder, SessionService sessions,
            LoginAttemptLimiter limiter, PrincipalAdmin principal) {
        this.users = users;
        this.encoder = encoder;
        this.sessions = sessions;
        this.limiter = limiter;
        this.principal = principal;
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
                .body(Map.of("usuario", AuthUser.of(found.get(), principal.is(found.get()))));
    }

    static final String PHOTO_PATTERN = "data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+";
    static final int PHOTO_MAX = 140_000;

    public record ProfileRequest(
            @NotBlank(message = "Escribe tu nombre.") @Size(max = 60, message = "Máximo 60 caracteres.") String nombre,
            @Size(max = PHOTO_MAX, message = "La foto es demasiado grande.")
            @jakarta.validation.constraints.Pattern(regexp = PHOTO_PATTERN, message = "Formato de foto no válido.")
            String foto,
            @jakarta.validation.constraints.Pattern(regexp = "[0-9 +()-]{7,20}", message = "Teléfono no válido (7 a 20 dígitos).")
            String telefono,
            @Size(max = 100, message = "Máximo 100 caracteres.")
            @jakarta.validation.constraints.Email(message = "Correo no válido.") String correo,
            @jakarta.validation.constraints.Pattern(regexp = "femenino|masculino|otro", message = "Opción no válida.")
            String sexo) {
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public record PasswordChangeRequest(
            @NotBlank(message = "Escribe tu contraseña actual.") @Size(max = 200) String actual,
            @NotBlank(message = "Escribe la nueva contraseña.")
            @Size(min = Credentials.PASSWORD_MIN, max = Credentials.PASSWORD_MAX,
                    message = Credentials.PASSWORD_MESSAGE) String nueva) {
    }

    @PutMapping("/profile")
    public Map<String, Object> updateProfile(@AuthenticationPrincipal AuthUser current,
            @Valid @RequestBody ProfileRequest request) {
        AppUser user = users.findById(current.id())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Tu sesión no está activa."));
        user.setNombre(request.nombre().trim());
        user.setFoto(request.foto());
        user.setTelefono(blankToNull(request.telefono()));
        user.setCorreo(blankToNull(request.correo()));
        user.setSexo(request.sexo());
        AppUser saved = users.save(user);
        return Map.of("usuario", AuthUser.of(saved, principal.is(saved)));
    }

    /** Cambia la propia contraseña: cierra las demás sesiones y renueva la actual. */
    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal AuthUser current,
            @Valid @RequestBody PasswordChangeRequest request) {
        AppUser user = users.findById(current.id())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Tu sesión no está activa."));
        if (!encoder.matches(request.actual(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La contraseña actual no es correcta.");
        }
        user.setPasswordHash(encoder.encode(request.nueva()));
        users.save(user);
        sessions.revokeAll(user.getId());
        String token = sessions.create(user.getId());
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, sessions.cookie(token).toString()).build();
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
