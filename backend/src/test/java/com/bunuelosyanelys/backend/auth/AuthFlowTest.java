package com.bunuelosyanelys.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;

class AuthFlowTest extends ApiTestSupport {

    @Test
    void sesionAnonimaDevuelveUsuarioNullYEmiteCookieCsrf() throws Exception {
        mvc.perform(get("/api/auth/session"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario").doesNotExist());
        assertThat(anonymous().csrf().getValue()).isNotBlank();
    }

    @Test
    void loginSinCabeceraCsrfSeRechaza() throws Exception {
        createUser("admin", "Yanelys", Role.ADMIN, true);
        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("usuario", "admin", "password", PASSWORD)))
                .andExpect(status().isForbidden());
    }

    @Test
    void loginCorrectoEmiteCookieSeguraYElRolLoDaElServidor() throws Exception {
        createUser("ana", "Ana", Role.COURIER, true);
        Browser browser = anonymous();
        MockHttpServletResponse response = mvc.perform(browser.with(post("/api/auth/login"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("usuario", "  ANA ", "password", PASSWORD, "role", "ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario.usuario").value("ana"))
                .andExpect(jsonPath("$.usuario.role").value("COURIER"))
                .andExpect(jsonPath("$.usuario.passwordHash").doesNotExist())
                .andReturn().getResponse();

        String setCookie = response.getHeaders("Set-Cookie").stream()
                .filter(header -> header.startsWith(AuthProperties.SESSION_COOKIE + "="))
                .findFirst().orElseThrow();
        assertThat(setCookie).contains("HttpOnly", "SameSite=Lax", "Path=/").doesNotContain("Domain");

        Browser logged = new Browser(browser.csrf(), response.getCookie(AuthProperties.SESSION_COOKIE));
        mvc.perform(logged.with(get("/api/auth/session")))
                .andExpect(jsonPath("$.usuario.nombre").value("Ana"));
    }

    @Test
    void credencialesIncorrectasDanElMismoMensajeExistaONoElUsuario() throws Exception {
        createUser("admin", "Yanelys", Role.ADMIN, true);
        Browser browser = anonymous();
        for (String usuario : new String[] {"admin", "no-existe"}) {
            mvc.perform(browser.with(post("/api/auth/login"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json("usuario", usuario, "password", "otra-clave-9")))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.error").value(AuthController.INVALID_CREDENTIALS));
        }
    }

    @Test
    void bloqueaTrasCincoFallosAunqueLuegoLaClaveSeaCorrecta() throws Exception {
        createUser("bloqueo", "Bloqueo", Role.ADMIN, true);
        Browser browser = anonymous();
        for (int i = 0; i < LoginAttemptLimiter.MAX_FAILURES; i++) {
            mvc.perform(browser.with(post("/api/auth/login"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json("usuario", "bloqueo", "password", "mala-clave-" + i)))
                    .andExpect(status().isUnauthorized());
        }
        mvc.perform(browser.with(post("/api/auth/login"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("usuario", "bloqueo", "password", PASSWORD)))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void logoutRevocaLaSesionEnElServidor() throws Exception {
        createUser("admin", "Yanelys", Role.ADMIN, true);
        Browser admin = login("admin");
        mvc.perform(admin.with(post("/api/auth/logout"))).andExpect(status().isNoContent());
        mvc.perform(admin.with(get("/api/orders"))).andExpect(status().isUnauthorized());
    }

    @Test
    void desactivarUnDomiciliarioCierraSusSesionesEImpideEntrar() throws Exception {
        createUser("admin", "Yanelys", Role.ADMIN, true);
        AppUser courier = createUser("luis", "Luis", Role.COURIER, true);
        Browser luis = login("luis");
        Browser admin = login("admin");

        mvc.perform(admin.with(patch("/api/couriers/" + courier.getId() + "/activo"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("activo", false)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activo").value(false));

        mvc.perform(luis.with(get("/api/orders"))).andExpect(status().isUnauthorized());
        Browser other = anonymous();
        mvc.perform(other.with(post("/api/auth/login"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("usuario", "luis", "password", PASSWORD)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void permisosPorRol() throws Exception {
        createUser("luis", "Luis", Role.COURIER, true);
        mvc.perform(get("/api/orders")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/dashboard")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/health")).andExpect(status().isOk());

        Browser luis = login("luis");
        mvc.perform(luis.with(get("/api/dashboard"))).andExpect(status().isForbidden());
        mvc.perform(luis.with(get("/api/couriers"))).andExpect(status().isForbidden());
        mvc.perform(luis.with(post("/api/couriers"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("nombre", "X", "usuario", "nuevo", "password", PASSWORD)))
                .andExpect(status().isForbidden());
    }

    @Test
    void elAdminCreaDomiciliariosConRolImpuestoYSinDuplicados() throws Exception {
        createUser("admin", "Yanelys", Role.ADMIN, true);
        Browser admin = login("admin");
        String body = json("nombre", "Pedro", "usuario", "pedro.r", "password", PASSWORD, "role", "ADMIN");
        mvc.perform(admin.with(post("/api/couriers")).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.usuario").value("pedro.r"))
                .andExpect(jsonPath("$.activo").value(true));
        assertThat(users.findByUsername("pedro.r").orElseThrow().getRole()).isEqualTo(Role.COURIER);

        mvc.perform(admin.with(post("/api/couriers")).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
        mvc.perform(admin.with(post("/api/couriers")).contentType(MediaType.APPLICATION_JSON)
                .content(json("nombre", "Corta", "usuario", "corta", "password", "123")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.password").exists());
    }
}
