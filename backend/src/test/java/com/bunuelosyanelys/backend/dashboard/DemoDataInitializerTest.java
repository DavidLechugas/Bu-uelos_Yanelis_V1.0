package com.bunuelosyanelys.backend.dashboard;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.mongodb.test.autoconfigure.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.ActiveProfiles;

/**
 * Verifica la semilla insert-only contra MongoDB local (base de pruebas
 * propia). Nunca borra ni sobrescribe datos existentes: solo limpia el
 * documento singleton de prueba al terminar.
 */
@DataMongoTest
@ActiveProfiles("test")
@Import(DemoDataInitializer.class)
class DemoDataInitializerTest {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private DemoDataInitializer initializer;

    @AfterEach
    void limpiaSoloSnapshotDePrueba() {
        mongoTemplate.remove(
                Query.query(Criteria.where("_id").is(DemoDataInitializer.DASHBOARD_ID)),
                DashboardSnapshot.class);
    }

    @Test
    void insertaElSingletonCuandoNoExiste() {
        assertThat(mongoTemplate.exists(
                Query.query(Criteria.where("_id").is(DemoDataInitializer.DASHBOARD_ID)),
                DashboardSnapshot.class)).isFalse();

        initializer.seed();

        DashboardSnapshot creado = mongoTemplate.findById(
                DemoDataInitializer.DASHBOARD_ID, DashboardSnapshot.class);
        assertThat(creado).isNotNull();
        assertThat(creado.getSaludo()).isEqualTo("Buenos días, Ana");
        assertThat(creado.getVentasTotales()).isEqualTo(428000);
        assertThat(creado.getPedidos()).isEqualTo(36);
        assertThat(creado.getAlertas()).isEqualTo(3);
        assertThat(creado.getEntregasActivas()).isEqualTo(4);
        assertThat(creado.getInventarioBajo())
                .singleElement()
                .satisfies(inv -> {
                    assertThat(inv.getProducto()).isEqualTo("Queso costeño");
                    assertThat(inv.getUnidades()).isEqualTo(2);
                    assertThat(inv.getMensaje()).isEqualTo("revisar");
                });
        assertThat(creado.getVentasUltimos7Dias()).hasSize(7);
    }

    @Test
    void noSobrescribeUnSnapshotExistente() {
        DashboardSnapshot existente = new DashboardSnapshot();
        existente.setId(DemoDataInitializer.DASHBOARD_ID);
        existente.setSaludo("Saludo ya existente");
        existente.setVentasTotales(123);
        existente.setPedidos(1);
        existente.setAlertas(1);
        existente.setEntregasActivas(1);
        mongoTemplate.save(existente);

        initializer.seed();

        DashboardSnapshot despues = mongoTemplate.findById(
                DemoDataInitializer.DASHBOARD_ID, DashboardSnapshot.class);
        assertThat(despues.getSaludo()).isEqualTo("Saludo ya existente");
        assertThat(despues.getVentasTotales()).isEqualTo(123);
        assertThat(despues.getPedidos()).isEqualTo(1);
    }
}
