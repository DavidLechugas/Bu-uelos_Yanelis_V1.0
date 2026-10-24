package com.bunuelosyanelys.backend.admins;

import java.time.Clock;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.bunuelosyanelys.backend.auth.AppUser;
import com.bunuelosyanelys.backend.auth.AppUserRepository;
import com.bunuelosyanelys.backend.auth.AuthUser;
import com.bunuelosyanelys.backend.auth.Credentials;
import com.bunuelosyanelys.backend.auth.PrincipalAdmin;
import com.bunuelosyanelys.backend.auth.Role;
import com.bunuelosyanelys.backend.auth.SessionService;
import com.bunuelosyanelys.backend.common.ApiException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Administradores adicionales: solo la cuenta principal los crea, activa o les cambia la contraseña. */
@RestController
@RequestMapping("/api/admins")
public class AdminController {

    public record AdminView(String id, String nombre, String usuario, boolean activo, boolean principal, String foto) {
    }

    public record CreateAdminRequest(
            @NotBlank(message = "Escribe el nombre.") @Size(max = 60, message = "Máximo 60 caracteres.") String nombre,
            @NotBlank(message = "Escribe el usuario.")
            @Pattern(regexp = Credentials.USERNAME_PATTERN, message = Credentials.USERNAME_MESSAGE) String usuario,
            @NotBlank(message = "Escribe la contraseña.")
            @Size(min = Credentials.PASSWORD_MIN, max = Credentials.PASSWORD_MAX,
                    message = Credentials.PASSWORD_MESSAGE) String password) {
    }

    public record ActiveRequest(@NotNull Boolean activo) {
    }

    public record PasswordRequest(
            @NotBlank(message = "Escribe la contraseña.")
            @Size(min = Credentials.PASSWORD_MIN, max = Credentials.PASSWORD_MAX,
                    message = Credentials.PASSWORD_MESSAGE) String password) {
    }

    private final AppUserRepository users;
    private final PasswordEncoder encoder;
    private final SessionService sessions;
    private final PrincipalAdmin principal;
    private final Clock clock;

    public AdminController(AppUserRepository users, PasswordEncoder encoder, SessionService sessions,
            PrincipalAdmin principal, Clock clock) {
        this.users = users;
        this.encoder = encoder;
        this.sessions = sessions;
        this.principal = principal;
        this.clock = clock;
    }

    @GetMapping
    public List<AdminView> list(@AuthenticationPrincipal AuthUser current) {
        requirePrincipal(current);
        return users.findByRoleOrderByNombreAsc(Role.ADMIN).stream().map(this::view).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminView create(@AuthenticationPrincipal AuthUser current, @Valid @RequestBody CreateAdminRequest request) {
        requirePrincipal(current);
        String username = Credentials.normalizeUsername(request.usuario());
        if (users.existsByUsername(username)) {
            throw new ApiException(HttpStatus.CONFLICT, "Ese usuario ya existe. Elige otro.");
        }
        AppUser admin = new AppUser();
        admin.setUsername(username);
        admin.setNombre(request.nombre().trim());
        admin.setPasswordHash(encoder.encode(request.password()));
        admin.setRole(Role.ADMIN);
        admin.setActivo(true);
        admin.setCreadoEn(clock.instant());
        return view(users.save(admin));
    }

    @PatchMapping("/{id}/activo")
    public AdminView setActive(@AuthenticationPrincipal AuthUser current, @PathVariable String id,
            @Valid @RequestBody ActiveRequest request) {
        requirePrincipal(current);
        AppUser admin = findOther(id, "La cuenta principal no se puede desactivar.");
        admin.setActivo(request.activo());
        AppUser saved = users.save(admin);
        if (!request.activo()) {
            sessions.revokeAll(id);
        }
        return view(saved);
    }

    @PutMapping("/{id}/password")
    public AdminView resetPassword(@AuthenticationPrincipal AuthUser current, @PathVariable String id,
            @Valid @RequestBody PasswordRequest request) {
        requirePrincipal(current);
        AppUser admin = findOther(id, "Cambia tu propia contraseña desde tu perfil.");
        admin.setPasswordHash(encoder.encode(request.password()));
        AppUser saved = users.save(admin);
        sessions.revokeAll(id);
        return view(saved);
    }

    private void requirePrincipal(AuthUser current) {
        if (!current.principal()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Solo la cuenta principal puede gestionar administradores.");
        }
    }

    private AppUser findOther(String id, String principalMessage) {
        AppUser admin = users.findById(id)
                .filter(user -> user.getRole() == Role.ADMIN)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Administrador no encontrado."));
        if (principal.is(admin)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, principalMessage);
        }
        return admin;
    }

    private AdminView view(AppUser user) {
        return new AdminView(user.getId(), user.getNombre(), user.getUsername(), user.isActivo(),
                principal.is(user), user.getFoto());
    }
}
