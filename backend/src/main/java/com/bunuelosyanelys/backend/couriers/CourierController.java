package com.bunuelosyanelys.backend.couriers;

import java.time.Clock;
import java.util.EnumSet;
import java.util.List;

import org.springframework.http.HttpStatus;
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
import com.bunuelosyanelys.backend.auth.Credentials;
import com.bunuelosyanelys.backend.auth.Role;
import com.bunuelosyanelys.backend.auth.SessionService;
import com.bunuelosyanelys.backend.common.ApiException;
import com.bunuelosyanelys.backend.orders.OrderRepository;
import com.bunuelosyanelys.backend.orders.OrderService;
import com.bunuelosyanelys.backend.orders.OrderStatus;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/couriers")
public class CourierController {

    /** pedidosLiberados: al desactivar, cuántos pedidos ASIGNADO volvieron a Pendientes (0 en el resto). */
    public record CourierView(String id, String nombre, String usuario, boolean activo, long pedidosActivos,
            String foto, long pedidosLiberados) {
    }

    public record CreateCourierRequest(
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

    private static final EnumSet<OrderStatus> ACTIVE =
            EnumSet.of(OrderStatus.ASIGNADO, OrderStatus.EN_CAMINO);

    private final AppUserRepository users;
    private final OrderRepository orders;
    private final OrderService orderService;
    private final PasswordEncoder encoder;
    private final SessionService sessions;
    private final Clock clock;

    public CourierController(AppUserRepository users, OrderRepository orders, OrderService orderService,
            PasswordEncoder encoder, SessionService sessions, Clock clock) {
        this.users = users;
        this.orders = orders;
        this.orderService = orderService;
        this.encoder = encoder;
        this.sessions = sessions;
        this.clock = clock;
    }

    @GetMapping
    public List<CourierView> list() {
        return users.findByRoleOrderByNombreAsc(Role.COURIER).stream().map(this::view).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CourierView create(@Valid @RequestBody CreateCourierRequest request) {
        String username = Credentials.normalizeUsername(request.usuario());
        if (users.existsByUsername(username)) {
            throw new ApiException(HttpStatus.CONFLICT, "Ese usuario ya existe. Elige otro.");
        }
        AppUser courier = new AppUser();
        courier.setUsername(username);
        courier.setNombre(request.nombre().trim());
        courier.setPasswordHash(encoder.encode(request.password()));
        courier.setRole(Role.COURIER);
        courier.setActivo(true);
        courier.setCreadoEn(clock.instant());
        return view(users.save(courier));
    }

    @PatchMapping("/{id}/activo")
    public CourierView setActive(@PathVariable String id, @Valid @RequestBody ActiveRequest request) {
        AppUser courier = find(id);
        courier.setActivo(request.activo());
        AppUser saved = users.save(courier);
        long released = 0;
        if (!request.activo()) {
            sessions.revokeAll(id);
            released = orderService.releaseAssigned(id);
        }
        return view(saved, released);
    }

    @PutMapping("/{id}/password")
    public CourierView resetPassword(@PathVariable String id, @Valid @RequestBody PasswordRequest request) {
        AppUser courier = find(id);
        courier.setPasswordHash(encoder.encode(request.password()));
        AppUser saved = users.save(courier);
        sessions.revokeAll(id);
        return view(saved);
    }

    private AppUser find(String id) {
        return users.findById(id)
                .filter(user -> user.getRole() == Role.COURIER)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Domiciliario no encontrado."));
    }

    private CourierView view(AppUser user) {
        return view(user, 0);
    }

    private CourierView view(AppUser user, long released) {
        return new CourierView(user.getId(), user.getNombre(), user.getUsername(), user.isActivo(),
                orders.countByDomiciliarioIdAndEstadoIn(user.getId(), ACTIVE), user.getFoto(), released);
    }
}
