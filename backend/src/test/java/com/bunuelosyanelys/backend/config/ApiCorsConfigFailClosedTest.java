package com.bunuelosyanelys.backend.config;

import org.springframework.test.context.bean.override.mockito.MockitoBean;
import com.bunuelosyanelys.backend.auth.SessionService;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import com.bunuelosyanelys.backend.health.HealthController;

/** Sin {@code FRONTEND_ORIGIN} no se registra ningún mapeo CORS y el navegador bloquea el acceso cruzado. */
@WebMvcTest(HealthController.class)
@Import({ApiCorsConfig.class, SecurityConfig.class})
class ApiCorsConfigFailClosedTest {

    @MockitoBean
    private SessionService sessionService;

    private static final String ORIGEN_CUALQUIERA =
            "https://cualquier-origen.example";

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Sin FRONTEND_ORIGIN el preflight no "
            + "lleva cabeceras CORS (el navegador lo bloquea)")
    void sinFrontendOriginElPreflightNoLlevaCabecerasCors()
            throws Exception {
        mockMvc.perform(
                options("/api/dashboard")
                        .header("Origin", ORIGEN_CUALQUIERA)
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Methods"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
    }

    @Test
    void sinFrontendOriginLasLecturasNoLlevanCabeceraCors()
            throws Exception {
        mockMvc.perform(get("/api/health")
                        .header("Origin", ORIGEN_CUALQUIERA))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
