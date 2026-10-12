package com.bunuelosyanelys.backend.dashboard;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.mongodb.test.autoconfigure.DataMongoTest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.ActiveProfiles;

/**
 * Integración contra MongoDB local en la base propia de pruebas
 * {@code bunuelos_yanelys_test}. Solo limpia el documento de prueba
 * propio: nunca borra ni sobrescribe datos existentes.
 */
@DataMongoTest
@ActiveProfiles("test")
class DashboardSnapshotRepositoryTest {

    private static final String TEST_ID = "test-dashboard-repository";

    @Autowired
    private DashboardSnapshotRepository repository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @AfterEach
    void limpiaSoloDocumentoDePrueba() {
        mongoTemplate.remove(
                Query.query(Criteria.where("_id").is(TEST_ID)), DashboardSnapshot.class);
    }

    @Test
    void guardaYLeeElSnapshot() {
        DashboardSnapshot snapshot = new DashboardSnapshot();
        snapshot.setId(TEST_ID);
        snapshot.setSaludo("Buenos días, Ana");
        snapshot.setVentasTotales(428000);
        snapshot.setPedidos(36);
        snapshot.setAlertas(3);
        snapshot.setEntregasActivas(4);
        snapshot.setInventarioBajo(
                java.util.List.of(new DashboardSnapshot.InventarioBajo("Queso costeño", 2, "revisar")));
        snapshot.setVentasUltimos7Dias(
                java.util.List.of(new DashboardSnapshot.VentaDiaria("Lun", 52000)));

        repository.save(snapshot);

        DashboardSnapshot leido = repository.findById(TEST_ID).orElseThrow();
        assertThat(leido.getSaludo()).isEqualTo("Buenos días, Ana");
        assertThat(leido.getVentasTotales()).isEqualTo(428000);
        assertThat(leido.getInventarioBajo()).hasSize(1);
        assertThat(leido.getInventarioBajo().get(0).getProducto()).isEqualTo("Queso costeño");
        assertThat(leido.getVentasUltimos7Dias().get(0).getVentas()).isEqualTo(52000);
    }
}
