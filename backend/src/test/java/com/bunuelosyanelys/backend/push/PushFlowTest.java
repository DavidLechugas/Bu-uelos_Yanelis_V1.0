package com.bunuelosyanelys.backend.push;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Base64;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import com.bunuelosyanelys.backend.auth.ApiTestSupport;
import com.bunuelosyanelys.backend.auth.AppUser;
import com.bunuelosyanelys.backend.auth.Role;

class PushFlowTest extends ApiTestSupport {

    @Autowired
    private StoredSubscriptionRepository subscriptions;

    private AppUser luis;

    @BeforeEach
    void setUp() {
        createUser("admin", "Yanelys", Role.ADMIN, true);
        luis = createUser("luis", "Luis", Role.COURIER, true);
        subscriptions.deleteAll();
    }

    private static String subscription(String endpoint) {
        return json("endpoint", endpoint, "keys", null).replace("\"keys\":null",
                "\"keys\":{\"p256dh\":\"BKey\",\"auth\":\"auth\"}");
    }

    @Test
    void laClavePublicaEsUnPuntoP256EnBase64Url() throws Exception {
        String body = mvc.perform(login("luis").with(get("/api/push/key")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String key = com.jayway.jsonpath.JsonPath.read(body, "$.publicKey");
        byte[] bytes = Base64.getUrlDecoder().decode(key);
        assertEquals(65, bytes.length);
        assertEquals(4, bytes[0]);
    }

    @Test
    void sinSesionNoSePuedeSuscribirNiPedirLaClave() throws Exception {
        mvc.perform(get("/api/push/key")).andExpect(status().isUnauthorized());
        mvc.perform(anonymous().with(post("/api/push/subscribe")).contentType(MediaType.APPLICATION_JSON)
                .content(subscription("https://push.example/1"))).andExpect(status().isUnauthorized());
    }

    @Test
    void unDispositivoGuardaUnaSolaSuscripcionYPasaALaUltimaCuenta() throws Exception {
        Browser courier = login("luis");
        mvc.perform(courier.with(post("/api/push/subscribe")).contentType(MediaType.APPLICATION_JSON)
                .content(subscription("https://push.example/1"))).andExpect(status().isNoContent());
        mvc.perform(courier.with(post("/api/push/subscribe")).contentType(MediaType.APPLICATION_JSON)
                .content(subscription("https://push.example/1"))).andExpect(status().isNoContent());
        assertEquals(1, subscriptions.count());

        mvc.perform(login("admin").with(post("/api/push/subscribe")).contentType(MediaType.APPLICATION_JSON)
                .content(subscription("https://push.example/1"))).andExpect(status().isNoContent());
        assertEquals(1, subscriptions.count());
        assertFalse(subscriptions.findByUserIdIn(java.util.List.of(luis.getId())).iterator().hasNext());

        mvc.perform(courier.with(post("/api/push/unsubscribe")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"endpoint\":\"https://push.example/1\"}")).andExpect(status().isNoContent());
        assertEquals(0, subscriptions.count());
    }

    @Test
    void rechazaSuscripcionesSinClaves() throws Exception {
        mvc.perform(login("luis").with(post("/api/push/subscribe")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"endpoint\":\"https://push.example/2\"}")).andExpect(status().isBadRequest());
    }

    @Test
    void elMensajeSeEscapaComoJson() {
        String json = PushNotifier.payload("Luis \"el rápido\"", "línea 1\nlínea 2 \\", "t");
        assertTrue(json.contains("\\\"el rápido\\\""));
        assertTrue(json.contains("\\n"));
        assertTrue(json.contains("\\\\"));
    }
}
