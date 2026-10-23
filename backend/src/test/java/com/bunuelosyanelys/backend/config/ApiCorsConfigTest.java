package com.bunuelosyanelys.backend.config;

import org.springframework.test.context.bean.override.mockito.MockitoBean;
import com.bunuelosyanelys.backend.auth.SessionService;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.bunuelosyanelys.backend.health.HealthController;

/** Con {@code FRONTEND_ORIGIN} se permite solo el origen exacto; cualquier otro recibe 403. */
@WebMvcTest(HealthController.class)
@Import({ApiCorsConfig.class, SecurityConfig.class})
@TestPropertySource(
        properties = "FRONTEND_ORIGIN=https://bunuelos-yanelys.pages.dev")
class ApiCorsConfigTest {

    @MockitoBean
    private SessionService sessionService;

    private static final String ORIGEN_PERMITIDO =
            "https://bunuelos-yanelys.pages.dev";
    private static final String ORIGEN_DESCONOCIDO =
            "https://origen-no-autorizado.example";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void preflightDelOrigenConfiguradoEsPermitido() throws Exception {
        mockMvc.perform(
                options("/api/dashboard")
                        .header("Origin", ORIGEN_PERMITIDO)
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header()
                        .string("Access-Control-Allow-Origin", ORIGEN_PERMITIDO))
                .andExpect(header()
                        .doesNotExist("Access-Control-Allow-Credentials"));
    }

    @Test
    void preflightDeOrigenDesconocidoSeRechaza() throws Exception {
        mockMvc.perform(
                options("/api/dashboard")
                        .header("Origin", ORIGEN_DESCONOCIDO)
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }

    @Test
    void lecturaDesdeElOrigenConfiguradoDevuelveLaCabeceraExacta()
            throws Exception {
        mockMvc.perform(get("/api/health")
                        .header("Origin", ORIGEN_PERMITIDO))
                .andExpect(status().isOk())
                .andExpect(header()
                        .string("Access-Control-Allow-Origin", ORIGEN_PERMITIDO))
                .andExpect(header()
                        .doesNotExist("Access-Control-Allow-Credentials"));
    }

    @Test
    void lecturaDesdeOrigenDesconocidoSeRechaza() throws Exception {
        mockMvc.perform(get("/api/health")
                        .header("Origin", ORIGEN_DESCONOCIDO))
                .andExpect(status().isForbidden());
    }
}
