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

/**
 * CORS con {@code FRONTEND_ORIGIN} configurado: el
 * preflight (OPTIONS) y las lecturas del origen EXACTO
 * se permiten; cualquier otro origen se rechaza con
 * 403 (preflight y petición real: "Invalid CORS
 * request").
 *
 * <p>Usa el slice web de {@link HealthController} (sin
 * MongoDB ni perfil activo): prueba el comportamiento
 * HTTP real de CORS sin tocar bases de datos ni
 * activar perfiles por accidente.
 */
@WebMvcTest(HealthController.class)
@Import({ApiCorsConfig.class, SecurityConfig.class})
@TestPropertySource(
        properties = "FRONTEND_ORIGIN=https://bunuelos-yanelys.pages.dev")
class ApiCorsConfigTest {

    /** La cadena de seguridad real necesita el servicio de sesiones. */
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
                // allowCredentials=false: la cabecera no
                // se emite (solo se envía cuando es true).
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
        // Hay un mapeo CORS, pero el origen no está en
        // la lista: Spring rechaza también la petición
        // real (no solo el preflight).
        mockMvc.perform(get("/api/health")
                        .header("Origin", ORIGEN_DESCONOCIDO))
                .andExpect(status().isForbidden());
    }
}
