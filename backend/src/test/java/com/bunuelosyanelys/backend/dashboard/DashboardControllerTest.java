package com.bunuelosyanelys.backend.dashboard;

import org.springframework.security.test.context.support.WithMockUser;
import com.bunuelosyanelys.backend.auth.SessionService;
import com.bunuelosyanelys.backend.config.SecurityConfig;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DashboardController.class)
@org.springframework.context.annotation.Import(SecurityConfig.class)
@WithMockUser(roles = "ADMIN")
class DashboardControllerTest {

    /** La cadena de seguridad real necesita el servicio de sesiones. */
    @MockitoBean
    private SessionService sessionService;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DashboardSnapshotRepository repository;

    @Test
    void devuelveElSnapshotDesdeMongo() throws Exception {
        DashboardSnapshot snapshot = new DashboardSnapshot();
        snapshot.setId(DemoDataInitializer.DASHBOARD_ID);
        snapshot.setSaludo("Buenos días, Ana");
        snapshot.setVentasTotales(428000);
        snapshot.setPedidos(36);
        snapshot.setAlertas(3);
        snapshot.setEntregasActivas(4);
        snapshot.setInventarioBajo(
                List.of(new DashboardSnapshot.InventarioBajo("Queso costeño", 2, "revisar")));
        snapshot.setVentasUltimos7Dias(List.of(new DashboardSnapshot.VentaDiaria("Lun", 52000)));

        when(repository.findById(DemoDataInitializer.DASHBOARD_ID)).thenReturn(Optional.of(snapshot));

        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saludo").value("Buenos días, Ana"))
                .andExpect(jsonPath("$.ventasTotales").value(428000))
                .andExpect(jsonPath("$.pedidos").value(36))
                .andExpect(jsonPath("$.alertas").value(3))
                .andExpect(jsonPath("$.entregasActivas").value(4))
                .andExpect(jsonPath("$.inventarioBajo[0].producto").value("Queso costeño"))
                .andExpect(jsonPath("$.inventarioBajo[0].unidades").value(2))
                .andExpect(jsonPath("$.ventasUltimos7Dias[0].dia").value("Lun"));
    }

    @Test
    void devuelve404CuandoNoHaySnapshotEnMongo() throws Exception {
        when(repository.findById(DemoDataInitializer.DASHBOARD_ID)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isNotFound());
    }
}
