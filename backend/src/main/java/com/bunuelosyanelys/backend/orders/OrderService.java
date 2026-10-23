package com.bunuelosyanelys.backend.orders;

import java.time.Clock;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.bunuelosyanelys.backend.auth.AppUser;
import com.bunuelosyanelys.backend.auth.AppUserRepository;
import com.bunuelosyanelys.backend.auth.AuthUser;
import com.bunuelosyanelys.backend.auth.Role;
import com.bunuelosyanelys.backend.common.ApiException;

/** Reglas de pedidos: propiedad por domiciliario y transiciones de estado válidas. */
@Service
public class OrderService {

    static final int LIST_LIMIT = 200;
    static final String LOCAL_CLIENT = "Venta en local";

    private static final Map<OrderStatus, OrderStatus> COURIER_TRANSITIONS = Map.of(
            OrderStatus.ASIGNADO, OrderStatus.EN_CAMINO,
            OrderStatus.EN_CAMINO, OrderStatus.ENTREGADO);

    private static final Set<OrderStatus> ASSIGNABLE = Set.of(OrderStatus.PENDIENTE, OrderStatus.ASIGNADO);
    private static final Set<OrderStatus> OPEN_STATUSES =
            Set.of(OrderStatus.PENDIENTE, OrderStatus.ASIGNADO, OrderStatus.EN_CAMINO);

    private final OrderRepository orders;
    private final AppUserRepository users;
    private final Clock clock;
    private final MongoTemplate mongo;

    public OrderService(OrderRepository orders, AppUserRepository users, Clock clock, MongoTemplate mongo) {
        this.orders = orders;
        this.users = users;
        this.clock = clock;
        this.mongo = mongo;
    }

    public List<Order> list(AuthUser user) {
        PageRequest page = PageRequest.of(0, LIST_LIMIT);
        if (user.isAdmin()) {
            return orders.findAllByOrderByCreadoEnDesc(page);
        }
        List<Order> result = new ArrayList<>(orders.findByDomiciliarioIdOrderByCreadoEnDesc(user.id(), page));
        // Disponibles: se ven para decidir si tomarlos, pero sin el teléfono hasta que sean suyos.
        for (Order available : orders.findByEstadoAndDomiciliarioIdIsNullAndTipoNotOrderByCreadoEnDesc(
                OrderStatus.PENDIENTE, OrderType.LOCAL, page)) {
            available.setTelefono("");
            result.add(available);
        }
        result.sort(Comparator.comparing(Order::getCreadoEn).reversed());
        return result.size() > LIST_LIMIT ? result.subList(0, LIST_LIMIT) : result;
    }

    /** Toma atómica: solo uno gana si varios lo intentan a la vez. */
    public Order claim(String orderId, AuthUser user) {
        Query query = new Query(new Criteria().andOperator(
                Criteria.where("_id").is(orderId),
                Criteria.where("estado").is(OrderStatus.PENDIENTE),
                Criteria.where("domiciliarioId").is(null),
                Criteria.where("tipo").ne(OrderType.LOCAL)));
        Update update = new Update()
                .set("domiciliarioId", user.id())
                .set("domiciliarioNombre", user.nombre())
                .set("estado", OrderStatus.ASIGNADO)
                .set("actualizadoEn", clock.instant());
        Order taken = mongo.findAndModify(query, update, FindAndModifyOptions.options().returnNew(true), Order.class);
        if (taken == null) {
            if (!orders.existsById(orderId)) {
                throw new ApiException(HttpStatus.NOT_FOUND, "Pedido no encontrado.");
            }
            throw new ApiException(HttpStatus.CONFLICT, "Otro domiciliario ya tomó este pedido.");
        }
        return taken;
    }

    /** Devuelve a Pendientes los pedidos aún sin salir (ASIGNADO) de un domiciliario; los EN_CAMINO no se tocan. */
    public long releaseAssigned(String courierId) {
        Query query = new Query(new Criteria().andOperator(
                Criteria.where("domiciliarioId").is(courierId),
                Criteria.where("estado").is(OrderStatus.ASIGNADO)));
        Update update = new Update()
                .set("estado", OrderStatus.PENDIENTE)
                .unset("domiciliarioId")
                .unset("domiciliarioNombre")
                .set("actualizadoEn", clock.instant());
        return mongo.updateMulti(query, update, Order.class).getModifiedCount();
    }

    public Order create(OrderController.CreateOrderRequest request) {
        Order order = new Order();
        applyDetails(order, request);
        order.setCreadoEn(clock.instant());
        if (request.tipo() == OrderType.LOCAL) {
            order.setTipo(OrderType.LOCAL);
            order.setEstado(OrderStatus.ENTREGADO);
        } else {
            order.setTipo(OrderType.DOMICILIO);
            applyCourier(order, request.domiciliarioId());
        }
        return save(order);
    }

    /** Escribe solo los datos, sin pisar una toma o un cambio de estado simultáneos. */
    public Order update(String orderId, OrderController.CreateOrderRequest request) {
        Order order = find(orderId);
        if (!order.getEstado().isOpen()) {
            throw new ApiException(HttpStatus.CONFLICT, "Solo se puede editar un pedido abierto (no entregado ni cancelado).");
        }
        OrderType requested = request.tipo() == OrderType.LOCAL ? OrderType.LOCAL : OrderType.DOMICILIO;
        if (requested != order.getTipo()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "No se puede cambiar el tipo de un pedido. Cancélalo y crea uno nuevo.");
        }
        applyDetails(order, request);
        Update update = new Update()
                .set("cliente", order.getCliente())
                .set("telefono", order.getTelefono())
                .set("direccion", order.getDireccion())
                .set("detalle", order.getDetalle())
                .set("totalCop", order.getTotalCop());
        return updateIfStill(orderId, Criteria.where("estado").in(OPEN_STATUSES), update);
    }

    public Order assign(String orderId, String courierId) {
        Order order = find(orderId);
        if (!ASSIGNABLE.contains(order.getEstado())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Solo se puede asignar un pedido pendiente o asignado (no en camino ni cerrado).");
        }
        applyCourier(order, courierId);
        Update update = new Update()
                .set("domiciliarioId", order.getDomiciliarioId())
                .set("domiciliarioNombre", order.getDomiciliarioNombre())
                .set("estado", order.getEstado());
        return updateIfStill(orderId, Criteria.where("estado").in(ASSIGNABLE), update);
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
        Criteria unchanged = new Criteria().andOperator(
                Criteria.where("estado").is(current),
                Criteria.where("domiciliarioId").is(order.getDomiciliarioId()));
        return updateIfStill(orderId, unchanged, new Update().set("estado", target));
    }

    /**
     * Aplica el cambio en una sola operación atómica y solo si el pedido sigue cumpliendo
     * la condición; si otro lo cambió mientras tanto, responde 409 en vez de pisarlo.
     */
    private Order updateIfStill(String orderId, Criteria condition, Update update) {
        Query query = new Query(new Criteria().andOperator(Criteria.where("_id").is(orderId), condition));
        update.set("actualizadoEn", clock.instant());
        Order changed = mongo.findAndModify(query, update, FindAndModifyOptions.options().returnNew(true), Order.class);
        if (changed == null) {
            if (!orders.existsById(orderId)) {
                throw new ApiException(HttpStatus.NOT_FOUND, "Pedido no encontrado.");
            }
            throw new ApiException(HttpStatus.CONFLICT,
                    "El pedido cambió mientras lo editabas. Recarga la lista e inténtalo de nuevo.");
        }
        return changed;
    }

    private void applyDetails(Order order, OrderController.CreateOrderRequest request) {
        boolean local = request.tipo() == OrderType.LOCAL;
        order.setCliente(local ? LOCAL_CLIENT : request.cliente().trim());
        order.setTelefono(local ? "" : request.telefono().trim());
        order.setDireccion(local ? "" : request.direccion().trim());
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
