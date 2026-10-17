package com.bunuelosyanelys.backend.dashboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.bunuelosyanelys.backend.auth.ApiTestSupport;
import com.bunuelosyanelys.backend.auth.AppUser;
import com.bunuelosyanelys.backend.auth.Role;
import com.jayway.jsonpath.JsonPath;

class DashboardAndProfileTest extends ApiTestSupport {

    private static final String PHOTO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD";

    private String createOrder(Browser admin, String courierId, long total) throws Exception {
        String body = mvc.perform(admin.with(post("/api/orders"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("cliente", "Carmen", "telefono", "3001234567", "direccion", "Cra 5",
                        "detalle", "12 buñuelos", "totalCop", total, "domiciliarioId", courierId)))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.id");
    }

    private void deliver(Browser admin, String id) throws Exception {
        for (String estado : new String[] {"EN_CAMINO", "ENTREGADO"}) {
            mvc.perform(admin.with(patch("/api/orders/" + id + "/estado"))
                    .contentType(MediaType.APPLICATION_JSON).content(json("estado", estado)))
                    .andExpect(status().isOk());
        }
    }

    @Test
    void elTableroSeCalculaConLosPedidosReales() throws Exception {
        createUser("admin", "Yanelys", Role.ADMIN, true);
        AppUser luis = createUser("luis", "Luis", Role.COURIER, true);
        Browser admin = login("admin");
        createOrder(admin, null, 10000);
        createOrder(admin, luis.getId(), 20000);
        deliver(admin, createOrder(admin, luis.getId(), 30000));

        mvc.perform(admin.with(get("/api/dashboard")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saludo").value(org.hamcrest.Matchers.endsWith(", Yanelys")))
                .andExpect(jsonPath("$.pedidos").value(3))
                .andExpect(jsonPath("$.entregasActivas").value(1))
                .andExpect(jsonPath("$.pendientesSinAsignar").value(1))
                .andExpect(jsonPath("$.ventasTotales").value(30000))
                .andExpect(jsonPath("$.ventasUltimos7Dias.length()").value(7))
                .andExpect(jsonPath("$.ventasUltimos7Dias[6].ventas").value(30000))
                .andExpect(jsonPath("$.actualizadoEn").exists());
    }

    @Test
    void saludoSegunLaHora() {
        assertThat(DashboardController.greeting(7)).isEqualTo("Buenos días");
        assertThat(DashboardController.greeting(15)).isEqualTo("Buenas tardes");
        assertThat(DashboardController.greeting(22)).isEqualTo("Buenas noches");
    }

    @Test
    void cadaUsuarioEditaSuNombreYFoto() throws Exception {
        createUser("luis", "Luis", Role.COURIER, true);
        Browser luis = login("luis");
        mvc.perform(luis.with(put("/api/auth/profile"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("nombre", " Luis Pérez ", "foto", PHOTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario.nombre").value("Luis Pérez"))
                .andExpect(jsonPath("$.usuario.foto").value(PHOTO))
                .andExpect(jsonPath("$.usuario.role").value("COURIER"));

        mvc.perform(luis.with(put("/api/auth/profile"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("nombre", "Luis", "foto", "javascript:alert(1)")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.foto").exists());

        mvc.perform(put("/api/auth/profile").contentType(MediaType.APPLICATION_JSON)
                .content(json("nombre", "X"))).andExpect(status().isForbidden());
    }

    @Test
    void elPerfilGuardaTelefonoCorreoYSexoOpcionales() throws Exception {
        createUser("luis", "Luis", Role.COURIER, true);
        Browser luis = login("luis");
        mvc.perform(luis.with(put("/api/auth/profile"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("nombre", "Luis", "telefono", "300 123 4567", "correo", "luis@correo.com", "sexo", "masculino")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario.telefono").value("300 123 4567"))
                .andExpect(jsonPath("$.usuario.correo").value("luis@correo.com"))
                .andExpect(jsonPath("$.usuario.sexo").value("masculino"));

        mvc.perform(luis.with(put("/api/auth/profile"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("nombre", "Luis", "telefono", "abc", "correo", "no-es-correo", "sexo", "x")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.telefono").exists())
                .andExpect(jsonPath("$.campos.correo").exists())
                .andExpect(jsonPath("$.campos.sexo").exists());

        mvc.perform(luis.with(put("/api/auth/profile"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("nombre", "Luis")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario.telefono").doesNotExist());
    }

    @Test
    void cambiarLaPropiaContrasenaExigeLaActualYCierraOtrasSesiones() throws Exception {
        createUser("admin", "Yanelys", Role.ADMIN, true);
        Browser phone = login("admin");
        Browser laptop = login("admin");

        mvc.perform(laptop.with(put("/api/auth/password"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("actual", "equivocada", "nueva", "otra-clave-segura")))
                .andExpect(status().isBadRequest());

        var response = mvc.perform(laptop.with(put("/api/auth/password"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("actual", PASSWORD, "nueva", "otra-clave-segura")))
                .andExpect(status().isNoContent())
                .andReturn().getResponse();

        mvc.perform(phone.with(get("/api/orders"))).andExpect(status().isUnauthorized());
        Browser renewed = new Browser(laptop.csrf(),
                response.getCookie(com.bunuelosyanelys.backend.auth.AuthProperties.SESSION_COOKIE));
        mvc.perform(renewed.with(get("/api/orders"))).andExpect(status().isOk());
    }
}
