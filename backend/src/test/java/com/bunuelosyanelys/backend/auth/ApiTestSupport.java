package com.bunuelosyanelys.backend.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.bunuelosyanelys.backend.orders.Order;

import jakarta.servlet.http.Cookie;

/** Pruebas HTTP con Spring completo y MongoDB local en la base de pruebas {@code bunuelos_yanelys_test}, nunca la real. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class ApiTestSupport {

    protected static final String PASSWORD = "clave-segura-1";

    @Autowired
    protected MockMvc mvc;
    @Autowired
    protected MongoTemplate mongo;
    @Autowired
    protected AppUserRepository users;
    @Autowired
    protected PasswordEncoder encoder;

    public record Browser(Cookie csrf, Cookie session) {

        public MockHttpServletRequestBuilder with(MockHttpServletRequestBuilder request) {
            request.cookie(csrf).header("X-XSRF-TOKEN", csrf.getValue());
            if (session != null) {
                request.cookie(session);
            }
            return request;
        }
    }

    @BeforeEach
    void cleanTestDatabase() {
        if (!"bunuelos_yanelys_test".equals(mongo.getDb().getName())) {
            throw new IllegalStateException("Las pruebas solo pueden usar la base bunuelos_yanelys_test");
        }
        mongo.dropCollection(AppUser.class);
        mongo.dropCollection(AuthSession.class);
        mongo.dropCollection(Order.class);
        mongo.dropCollection(com.bunuelosyanelys.backend.products.Product.class);
    }

    protected AppUser createUser(String username, String nombre, Role role, boolean activo) {
        AppUser user = new AppUser();
        user.setUsername(username);
        user.setNombre(nombre);
        user.setPasswordHash(encoder.encode(PASSWORD));
        user.setRole(role);
        user.setActivo(activo);
        user.setCreadoEn(Instant.now());
        return users.save(user);
    }

    protected Browser anonymous() throws Exception {
        MvcResult result = mvc.perform(get("/api/auth/session")).andReturn();
        Cookie csrf = result.getResponse().getCookie("XSRF-TOKEN");
        if (csrf == null) {
            throw new IllegalStateException("La API no emitió la cookie CSRF");
        }
        return new Browser(csrf, null);
    }

    protected Browser login(String username) throws Exception {
        Browser browser = anonymous();
        MvcResult result = mvc.perform(browser.with(post("/api/auth/login"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("usuario", username, "password", PASSWORD)))
                .andReturn();
        Cookie session = result.getResponse().getCookie(AuthProperties.SESSION_COOKIE);
        if (result.getResponse().getStatus() != 200 || session == null) {
            throw new IllegalStateException("Login fallido para " + username);
        }
        return new Browser(browser.csrf(), session);
    }

    protected static String json(Object... pairs) {
        StringBuilder out = new StringBuilder("{");
        for (int i = 0; i < pairs.length; i += 2) {
            if (i > 0) {
                out.append(',');
            }
            out.append('"').append(pairs[i]).append("\":");
            Object value = pairs[i + 1];
            out.append(value instanceof String text ? '"' + text.replace("\"", "\\\"") + '"' : String.valueOf(value));
        }
        return out.append('}').toString();
    }
}
