package com.bunuelosyanelys.backend.health;

import org.springframework.test.context.bean.override.mockito.MockitoBean;
import com.bunuelosyanelys.backend.auth.SessionService;
import com.bunuelosyanelys.backend.config.SecurityConfig;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(HealthController.class)
@org.springframework.context.annotation.Import(SecurityConfig.class)
class HealthControllerTest {

    @MockitoBean
    private SessionService sessionService;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void reportaEstadoUp() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }
}
