package com.bunuelosyanelys.backend.orders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.bunuelosyanelys.backend.auth.ApiTestSupport;
import com.bunuelosyanelys.backend.auth.Role;
import com.jayway.jsonpath.JsonPath;

class ProductFlowTest extends ApiTestSupport {

    private Browser admin;

    @BeforeEach
    void setUp() throws Exception {
        createUser("admin", "Yanelys", Role.ADMIN, true);
        createUser("luis", "Luis", Role.COURIER, true);
        admin = login("admin");
    }

    @Test
    void creaEditaYListaProductos() throws Exception {
        String body = mvc.perform(admin.with(post("/api/products"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("nombre", "  Docena  ", "descripcion", "12 buñuelos", "precio", 18000, "disponible", true)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre").value("Docena"))
                .andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(body, "$.id");

        mvc.perform(admin.with(put("/api/products/" + id))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("nombre", "Docena", "descripcion", "12 buñuelos", "precio", 20000, "disponible", false)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.precio").value(20000))
                .andExpect(jsonPath("$.disponible").value(false));

        mvc.perform(admin.with(get("/api/products")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].precio").value(20000));
    }

    @Test
    void validaYSoloElAdminAccede() throws Exception {
        mvc.perform(admin.with(post("/api/products"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("nombre", "", "precio", 0)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nombre").exists())
                .andExpect(jsonPath("$.campos.precio").exists());
        mvc.perform(admin.with(put("/api/products/no-existe"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("nombre", "A", "precio", 100)))
                .andExpect(status().isNotFound());
        mvc.perform(login("luis").with(get("/api/products"))).andExpect(status().isForbidden());
    }
}
