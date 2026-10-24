package com.bunuelosyanelys.backend.admins;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.bunuelosyanelys.backend.auth.ApiTestSupport;
import com.bunuelosyanelys.backend.auth.AppUser;
import com.bunuelosyanelys.backend.auth.Role;
import com.jayway.jsonpath.JsonPath;

class AdminFlowTest extends ApiTestSupport {

    private AppUser second;
    private Browser principal;

    @BeforeEach
    void setUp() throws Exception {
        createUser("admin", "Yanelys", Role.ADMIN, true);
        second = createUser("encargado", "Encargado", Role.ADMIN, true);
        createUser("luis", "Luis", Role.COURIER, true);
        principal = login("admin");
    }

    @Test
    void laSesionIndicaSiLaCuentaEsLaPrincipal() throws Exception {
        mvc.perform(principal.with(get("/api/auth/session")))
                .andExpect(jsonPath("$.usuario.principal").value(true));
        mvc.perform(login("encargado").with(get("/api/auth/session")))
                .andExpect(jsonPath("$.usuario.principal").value(false));
    }

    @Test
    void soloLaPrincipalGestionaAdministradores() throws Exception {
        mvc.perform(principal.with(get("/api/admins")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
        Browser other = login("encargado");
        mvc.perform(other.with(get("/api/admins"))).andExpect(status().isForbidden());
        mvc.perform(other.with(post("/api/admins")).contentType(MediaType.APPLICATION_JSON)
                .content(json("nombre", "X", "usuario", "otro", "password", "clave-larga-1")))
                .andExpect(status().isForbidden());
        mvc.perform(login("luis").with(get("/api/admins"))).andExpect(status().isForbidden());
    }

    @Test
    void laPrincipalCreaUnAdministradorQuePuedeAsignarPedidos() throws Exception {
        String body = mvc.perform(principal.with(post("/api/admins")).contentType(MediaType.APPLICATION_JSON)
                .content(json("nombre", "Ayudante", "usuario", "ayudante", "password", PASSWORD)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.principal").value(false))
                .andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(body, "$.id");

        mvc.perform(principal.with(post("/api/admins")).contentType(MediaType.APPLICATION_JSON)
                .content(json("nombre", "Otro", "usuario", "ayudante", "password", "clave-larga-1")))
                .andExpect(status().isConflict());

        Browser helper = login("ayudante");
        mvc.perform(helper.with(get("/api/orders"))).andExpect(status().isOk());
        mvc.perform(helper.with(get("/api/couriers"))).andExpect(status().isOk());

        mvc.perform(principal.with(patch("/api/admins/" + id + "/activo")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"activo\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activo").value(false));
        mvc.perform(helper.with(get("/api/orders"))).andExpect(status().isUnauthorized());
    }

    @Test
    void laCuentaPrincipalNoSeDesactivaNiSeLeCambiaLaContrasenaDesdeAqui() throws Exception {
        String list = mvc.perform(principal.with(get("/api/admins"))).andReturn().getResponse().getContentAsString();
        String principalId = JsonPath.<java.util.List<String>>read(list, "$[?(@.principal==true)].id").get(0);
        mvc.perform(principal.with(patch("/api/admins/" + principalId + "/activo"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"activo\":false}"))
                .andExpect(status().isBadRequest());
        mvc.perform(principal.with(put("/api/admins/" + principalId + "/password"))
                .contentType(MediaType.APPLICATION_JSON).content(json("password", "otra-clave-larga")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cambiarLaContrasenaDeUnAdministradorCierraSusSesiones() throws Exception {
        Browser other = login("encargado");
        mvc.perform(principal.with(put("/api/admins/" + second.getId() + "/password"))
                .contentType(MediaType.APPLICATION_JSON).content(json("password", "otra-clave-larga")))
                .andExpect(status().isOk());
        mvc.perform(other.with(get("/api/orders"))).andExpect(status().isUnauthorized());
    }
}
