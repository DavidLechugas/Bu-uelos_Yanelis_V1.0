package com.bunuelosyanelys.backend.orders;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.stereotype.Component;

/** Índices de las consultas de la lista de pedidos (se refresca cada 10 s) y del tablero. */
@Component
class OrderIndexes {

    private final MongoTemplate mongo;

    OrderIndexes(MongoTemplate mongo) {
        this.mongo = mongo;
    }

    @EventListener(ApplicationReadyEvent.class)
    void ensureIndexes() {
        var orders = mongo.indexOps(Order.class);
        orders.createIndex(new Index().on("creadoEn", Sort.Direction.DESC));
        orders.createIndex(new Index().on("domiciliarioId", Sort.Direction.ASC).on("creadoEn", Sort.Direction.DESC));
        orders.createIndex(new Index().on("estado", Sort.Direction.ASC)
                .on("domiciliarioId", Sort.Direction.ASC).on("creadoEn", Sort.Direction.DESC));
        orders.createIndex(new Index().on("estado", Sort.Direction.ASC).on("actualizadoEn", Sort.Direction.DESC));
    }
}
