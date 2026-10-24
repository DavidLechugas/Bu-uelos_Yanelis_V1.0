package com.bunuelosyanelys.backend.auth;

import java.time.Duration;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.stereotype.Component;

/** Índices de usuarios y sesiones (idempotente en cada arranque). */
@Component
class AuthIndexes {

    private final MongoTemplate mongo;

    AuthIndexes(MongoTemplate mongo) {
        this.mongo = mongo;
    }

    @EventListener(ApplicationReadyEvent.class)
    void ensureIndexes() {
        mongo.indexOps(AppUser.class)
                .createIndex(new Index("username", Sort.Direction.ASC).unique());
        mongo.indexOps(AuthSession.class)
                .createIndex(new Index("expiraEn", Sort.Direction.ASC).expire(Duration.ZERO));
        mongo.indexOps(AuthSession.class).createIndex(new Index("userId", Sort.Direction.ASC));
        mongo.indexOps(AppUser.class)
                .createIndex(new Index().on("role", Sort.Direction.ASC).on("creadoEn", Sort.Direction.ASC));
    }
}
