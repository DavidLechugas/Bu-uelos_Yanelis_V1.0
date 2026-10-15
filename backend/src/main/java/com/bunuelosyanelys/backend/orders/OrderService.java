package com.bunuelosyanelys.backend.orders;

import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.bunuelosyanelys.backend.auth.AppUser;
import com.bunuelosyanelys.backend.auth.AppUserRepository;
import com.bunuelosyanelys.backend.auth.AuthUser;
import com.bunuelosyanelys.backend.auth.Role;
import com.bunuelosyanelys.backend.common.ApiException;

/**
 * Reglas de pedidos. Los permisos por rol están en SecurityConfig; aquí se
 * comprueba la propiedad (un domiciliario solo ve y mueve SUS pedidos) y
 * que cada cambio de estado sea una transición válida.
 */
@Service
public class OrderService {

    static final int LIST_LIMIT = 200;

    /** Transiciones que puede hacer el domiciliario asignado. */
    private static final Map<OrderStatus, OrderStatus> COURIER_TRANSITIONS = Map.of(
            OrderStatus.ASIGNADO, OrderStatus.EN_CAMINO,
            OrderStatus.EN_CAMINO, OrderStatus.ENTREGADO);

    private static final Set<OrderStatus> ASSIGNABLE = Set.of(OrderStatus.PENDIENTE, OrderStatus.ASIGNADO);

    private final OrderRepository orders;
    private final AppUserRepository users;
    private final Clock clock;

    public OrderService(OrderRepository orders, AppUserRepository users, Clock clock) {
        this.orders = orders;
        this.users = users;
        this.clock = clock;
    }

    public List<Order> list(AuthUser user) {
        PageRequest page = PageRequest.of(0, LIST_LIMIT);
        return user.isAdmin()
                ? orders.findAllByOrderByCreadoEnDesc(page)
                : orders.findByDomiciliarioIdOrderByCreadoEnDesc(user.id(), page);
    }

    public Order create(OrderController.CreateOrderRequest request) {
        Order order = new Order();
        applyDetails(order, request);
        order.setCreadoEn(clock.instant());
        applyCourier(order, request.domiciliarioId());
        return save(order);
    }

    /** Corrige los datos de un pedido abierto; el domiciliario y el estado no cambian. */
    public Order update(String orderId, OrderController.CreateOrderRequest request) {
        Order order = find(orderId);
        if (!order.getEstado().isOpen()) {
            throw new ApiException(HttpStatus.CONFLICT, "Solo se puede editar un pedido abierto (no entregado ni cancelado).");
        }
        applyDetails(order, request);
        return save(order);
    }

    public Order assign(String orderId, String courierId) {
        Order order = find(orderId);
        if (!ASSIGNABLE.contains(order.getEstado())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Solo se puede asignar un pedido pendiente o asignado (no en camino ni cerrado).");
        }
        applyCourier(order, courierId);
        return save(order);
    }

    public Order changeStatus(String orderId, OrderStatus target, AuthUser user) {
        Order order = find(orderId);
        OrderStatus current = order.getEstado();
        if (!user.isAdmin()) {
            if (!user.id().equals(order.getDomiciliarioId())) {
                // 404 y no 403: no revelar pedidos ajenos.
                throw new ApiException(HttpStatus.NOT_FOUND, "Pedido no encontrado.");
            }
            if (COURIER_TRANSITIONS.get(current) != target) {
                throw new ApiException(HttpStatus.CONFLICT, "Ese cambio de estado no está permitido.");
            }
        } else if (!(COURIER_TRANSITIONS.get(current) == target
                || (target == OrderStatus.CANCELADO && current.isOpen()))) {
            throw new ApiException(HttpStatus.CONFLICT, "Ese cambio de estado no está permitido.");
        }
        order.setEstado(target);
        return save(order);
    }

    private void applyDetails(Order order, OrderController.CreateOrderRequest request) {
        order.setCliente(request.cliente().trim());
        order.setTelefono(request.telefono().trim());
        order.setDireccion(request.direccion().trim());
        order.setDetalle(request.detalle().trim());
        order.setTotalCop(request.totalCop());
    }

    private void applyCourier(Order order, String courierId) {
        if (courierId == null || courierId.isBlank()) {
            order.setDomiciliarioId(null);
            order.setDomiciliarioNombre(null);
            order.setEstado(OrderStatus.PENDIENTE);
            return;
        }
        AppUser courier = users.findById(courierId)
                .filter(user -> user.getRole() == Role.COURIER && user.isActivo())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "El domiciliario elegido no existe o está inactivo."));
        order.setDomiciliarioId(courier.getId());
        order.setDomiciliarioNombre(courier.getNombre());
        order.setEstado(OrderStatus.ASIGNADO);
    }

    private Order find(String orderId) {
        return orders.findById(orderId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pedido no encontrado."));
    }

    private Order save(Order order) {
        order.setActualizadoEn(clock.instant());
        return orders.save(order);
    }
}
