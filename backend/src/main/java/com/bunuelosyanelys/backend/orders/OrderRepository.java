package com.bunuelosyanelys.backend.orders;

import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface OrderRepository extends MongoRepository<Order, String> {

    List<Order> findAllByOrderByCreadoEnDesc(Pageable page);

    List<Order> findByDomiciliarioIdOrderByCreadoEnDesc(String domiciliarioId, Pageable page);

    /** Pedidos a domicilio pendientes que nadie ha tomado (los antiguos sin tipo cuentan como domicilio). */
    List<Order> findByEstadoAndDomiciliarioIdIsNullAndTipoNotOrderByCreadoEnDesc(OrderStatus estado, OrderType tipo, Pageable page);

    long countByDomiciliarioIdAndEstadoIn(String domiciliarioId, Collection<OrderStatus> estados);

    List<Order> findByEstadoAndActualizadoEnGreaterThanEqual(OrderStatus estado, java.time.Instant desde);

    long countByCreadoEnGreaterThanEqual(java.time.Instant desde);

    long countByEstadoIn(Collection<OrderStatus> estados);

    long countByEstado(OrderStatus estado);
}
