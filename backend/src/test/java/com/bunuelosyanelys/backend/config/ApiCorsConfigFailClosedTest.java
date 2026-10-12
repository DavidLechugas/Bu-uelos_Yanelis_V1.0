package com.bunuelosyanelys.backend.config;

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

/**
 * Fail closed: sin {@code FRONTEND_ORIGIN} no se
 * registra ningún mapeo CORS. Las respuestas no llevan
 * cabeceras CORS, así que el navegador bloquea todo
 * acceso cruzado:
 * <ul>
 *   <li>Preflight: la respuesta no contiene
 *       {@code Access-Control-Allow-*} → el navegador
 *       no envía la petición real.</li>
 *   <li>Lectura: sin {@code Access-Control-Allow-Origin}
 *       el navegador oculta la respuesta al JS.</li>
 * </ul>
 *
 * <p>Igual que {@link ApiCorsConfigTest}: slice web sin
 * MongoDB y sin activar ningún perfil.
 */
@WebMvcTest(HealthController.class)
@Import(ApiCorsConfig.class)
class ApiCorsConfigFailClosedTest {

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
                // Sin mapeo CORS, Spring no procesa CORS:
                // no hay cabeceras Access-Control-* y el
                // navegador rechaza el preflight.
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
