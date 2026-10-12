package com.bunuelosyanelys.backend.dashboard;

import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Datos del tablero leídos desde MongoDB (fuente real).
 *
 * <p>Endpoint de demostración SIN autenticación: documentado para uso LOCAL
 * únicamente, no usar en producción.
 */
@RestController
@RequestMapping("/api")
public class DashboardController {

    private final DashboardSnapshotRepository repository;

    public DashboardController(DashboardSnapshotRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardSnapshot> dashboard() {
        Optional<DashboardSnapshot> snapshot = repository.findById(DemoDataInitializer.DASHBOARD_ID);
        return snapshot.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
