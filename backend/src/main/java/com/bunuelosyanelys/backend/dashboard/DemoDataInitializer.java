package com.bunuelosyanelys.backend.dashboard;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import com.mongodb.client.result.UpdateResult;

/**
 * Semilla de demostración, activa ÚNICAMENTE en los perfiles {@code dev} y
 * {@code test}.
 *
 * <p>Escribe un único documento (singleton) en la colección propia
 * {@code dashboard_snapshot} mediante un upsert con solo {@code $setOnInsert}:
 * si el documento ya existe, no se modifica, borra ni sobrescribe nada. La base
 * y las colecciones existentes nunca se tocan.
 */
@Component
@Profile({"dev", "test"})
public class DemoDataInitializer implements ApplicationRunner {

    static final String DASHBOARD_ID = "dashboard-demo";

    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

    private final MongoTemplate mongoTemplate;

    public DemoDataInitializer(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        seed();
    }

    /** Inserta el snapshot de demostración solo si no existe (insert-only). */
    public void seed() {
        Query query = Query.query(Criteria.where("_id").is(DASHBOARD_ID));

        Update update = new Update();
        update.setOnInsert("saludo", "Buenos días, Ana");
        update.setOnInsert("ventasTotales", 428000);
        update.setOnInsert("pedidos", 36);
        update.setOnInsert("alertas", 3);
        update.setOnInsert("entregasActivas", 4);
        update.setOnInsert("inventarioBajo",
                List.of(new DashboardSnapshot.InventarioBajo("Queso costeño", 2, "revisar")));
        update.setOnInsert("ventasUltimos7Dias", List.of(
                new DashboardSnapshot.VentaDiaria("Lun", 52000),
                new DashboardSnapshot.VentaDiaria("Mar", 61000),
                new DashboardSnapshot.VentaDiaria("Mié", 47000),
                new DashboardSnapshot.VentaDiaria("Jue", 58000),
                new DashboardSnapshot.VentaDiaria("Vie", 72000),
                new DashboardSnapshot.VentaDiaria("Sáb", 68000),
                new DashboardSnapshot.VentaDiaria("Dom", 70000)));

        UpdateResult result = mongoTemplate.upsert(query, update, DashboardSnapshot.class);

        if (result.getUpsertedId() != null) {
            log.info("Semilla de demostración insertada en la colección dashboard_snapshot (perfil dev)");
        } else {
            log.info("Semilla de demostración: ya existe un snapshot, se preserva sin sobrescribir");
        }
    }
}
