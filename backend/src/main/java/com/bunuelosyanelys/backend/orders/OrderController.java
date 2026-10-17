package com.bunuelosyanelys.backend.orders;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.bunuelosyanelys.backend.auth.AuthUser;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Pedidos: el admin crea y asigna; cada domiciliario ve y avanza los suyos. */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @ValidOrder
    public record CreateOrderRequest(
            @Size(max = 80, message = "Máximo 80 caracteres.") String cliente,
            @Pattern(regexp = "([0-9 +()-]{7,20})?", message = "Usa de 7 a 20 dígitos (se permiten espacios, +, guiones y paréntesis).") String telefono,
            @Size(max = 160, message = "Máximo 160 caracteres.") String direccion,
            @NotBlank(message = "Describe el pedido.") @Size(max = 500, message = "Máximo 500 caracteres.") String detalle,
            @NotNull(message = "Escribe el total.") @Min(value = 1, message = "El total debe ser mayor que 0.") @Max(value = 100_000_000, message = "El total es demasiado alto.") Long totalCop,
            @Size(max = 64) String domiciliarioId,
            OrderType tipo) {
    }

    public record AssignRequest(@Size(max = 64) String domiciliarioId) {
    }

    public record StatusRequest(@NotNull(message = "Indica el nuevo estado.") OrderStatus estado) {
    }

    private final OrderService service;

    public OrderController(OrderService service) {
        this.service = service;
    }

    @GetMapping
    public List<Order> list(@AuthenticationPrincipal AuthUser user) {
        return service.list(user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Order create(@Valid @RequestBody CreateOrderRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public Order update(@PathVariable String id, @Valid @RequestBody CreateOrderRequest request) {
        return service.update(id, request);
    }

    /** Un domiciliario toma un pedido disponible; el primero que llega se lo queda. */
    @PostMapping("/{id}/tomar")
    public Order claim(@PathVariable String id, @AuthenticationPrincipal AuthUser user) {
        return service.claim(id, user);
    }

    @PutMapping("/{id}/domiciliario")
    public Order assign(@PathVariable String id, @Valid @RequestBody AssignRequest request) {
        return service.assign(id, request.domiciliarioId());
    }

    @PatchMapping("/{id}/estado")
    public Order changeStatus(@PathVariable String id, @Valid @RequestBody StatusRequest request,
            @AuthenticationPrincipal AuthUser user) {
        return service.changeStatus(id, request.estado(), user);
    }
}
