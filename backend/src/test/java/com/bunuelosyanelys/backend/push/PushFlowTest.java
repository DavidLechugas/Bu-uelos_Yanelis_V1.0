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
                .content(subscription("https://fcm.googleapis.com/fcm/send/1"))).andExpect(status().isUnauthorized());
    }

    @Test
    void unDispositivoGuardaUnaSolaSuscripcionYPasaALaUltimaCuenta() throws Exception {
        Browser courier = login("luis");
        mvc.perform(courier.with(post("/api/push/subscribe")).contentType(MediaType.APPLICATION_JSON)
                .content(subscription("https://fcm.googleapis.com/fcm/send/1"))).andExpect(status().isNoContent());
        mvc.perform(courier.with(post("/api/push/subscribe")).contentType(MediaType.APPLICATION_JSON)
                .content(subscription("https://fcm.googleapis.com/fcm/send/1"))).andExpect(status().isNoContent());
        assertEquals(1, subscriptions.count());

        mvc.perform(login("admin").with(post("/api/push/subscribe")).contentType(MediaType.APPLICATION_JSON)
                .content(subscription("https://fcm.googleapis.com/fcm/send/1"))).andExpect(status().isNoContent());
        assertEquals(1, subscriptions.count());
        assertFalse(subscriptions.findByUserIdIn(java.util.List.of(luis.getId())).iterator().hasNext());

        // Quien no es dueño de la suscripción no puede darla de baja.
        mvc.perform(courier.with(post("/api/push/unsubscribe")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/1\"}")).andExpect(status().isNoContent());
        assertEquals(1, subscriptions.count());
        mvc.perform(login("admin").with(post("/api/push/unsubscribe")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/1\"}")).andExpect(status().isNoContent());
        assertEquals(0, subscriptions.count());
    }

    @Test
    void rechazaSuscripcionesSinClaves() throws Exception {
        mvc.perform(login("luis").with(post("/api/push/subscribe")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/2\"}")).andExpect(status().isBadRequest());
    }

    @Test
    void rechazaDestinosQueNoSonServiciosPush() throws Exception {
        Browser courier = login("luis");
        for (String endpoint : new String[] {
                "http://fcm.googleapis.com/fcm/send/1",
                "https://169.254.169.254/latest/meta-data",
                "https://127.0.0.1:8080/api/health",
                "https://fcm.googleapis.com.evil.example/x",
                "https://evil.example/fcm.googleapis.com",
                "https://user@fcm.googleapis.com/x",
                "https://fcm.googleapis.com:8443/x"}) {
            mvc.perform(courier.with(post("/api/push/subscribe")).contentType(MediaType.APPLICATION_JSON)
                    .content(subscription(endpoint))).andExpect(status().isBadRequest());
        }
        assertEquals(0, subscriptions.count());
    }

    @Test
    void limitaLosDispositivosPorCuenta() throws Exception {
        Browser courier = login("luis");
        for (int i = 0; i < PushController.MAX_PER_USER; i++) {
            mvc.perform(courier.with(post("/api/push/subscribe")).contentType(MediaType.APPLICATION_JSON)
                    .content(subscription("https://fcm.googleapis.com/fcm/send/d" + i))).andExpect(status().isNoContent());
        }
        mvc.perform(courier.with(post("/api/push/subscribe")).contentType(MediaType.APPLICATION_JSON)
                .content(subscription("https://fcm.googleapis.com/fcm/send/extra"))).andExpect(status().isConflict());
        mvc.perform(courier.with(post("/api/push/subscribe")).contentType(MediaType.APPLICATION_JSON)
                .content(subscription("https://fcm.googleapis.com/fcm/send/d0"))).andExpect(status().isNoContent());
    }

    @Test
    void restablecerLaContrasenaOdesactivarQuitaSusDispositivos() throws Exception {
        Browser admin = login("admin");
        mvc.perform(login("luis").with(post("/api/push/subscribe")).contentType(MediaType.APPLICATION_JSON)
                .content(subscription("https://fcm.googleapis.com/fcm/send/luis"))).andExpect(status().isNoContent());
        mvc.perform(admin.with(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/couriers/" + luis.getId() + "/password"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"password\":\"otra-clave-99\"}")).andExpect(status().isOk());
        assertEquals(0, subscriptions.count());
    }

    @Test
    void rechazaCuerposDemasiadoGrandes() throws Exception {
        String body = "{\"endpoint\":\"" + "a".repeat(300_000) + "\"}";
        mvc.perform(login("luis").with(post("/api/push/unsubscribe")).contentType(MediaType.APPLICATION_JSON)
                .content(body)).andExpect(status().isContentTooLarge());
    }

    @Test
    void elMensajeSeEscapaComoJson() {
        String json = PushNotifier.payload("Luis \"el rápido\"", "línea 1\nlínea 2 \\", "t");
        assertTrue(json.contains("\\\"el rápido\\\""));
        assertTrue(json.contains("\\n"));
        assertTrue(json.contains("\\\\"));
    }
}
