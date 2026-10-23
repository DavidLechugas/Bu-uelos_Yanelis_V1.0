package com.bunuelosyanelys.backend.orders;

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

class OrderFlowTest extends ApiTestSupport {

    private AppUser luis;
    private AppUser marta;
    private Browser admin;

    @BeforeEach
    void setUp() throws Exception {
        createUser("admin", "Yanelys", Role.ADMIN, true);
        luis = createUser("luis", "Luis", Role.COURIER, true);
        marta = createUser("marta", "Marta", Role.COURIER, true);
        admin = login("admin");
    }

    private String createOrder(String courierId) throws Exception {
        String body = mvc.perform(admin.with(post("/api/orders"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("cliente", "Carmen", "telefono", "300 123 4567", "direccion", "Cra 5 #10-20",
                        "detalle", "12 buñuelos", "totalCop", 24000, "domiciliarioId", courierId)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.id");
    }

    private org.springframework.test.web.servlet.ResultActions setStatus(Browser who, String id, String estado)
            throws Exception {
        return mvc.perform(who.with(patch("/api/orders/" + id + "/estado"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("estado", estado)));
    }

    @Test
    void crearSinDomiciliarioQuedaPendienteYConDomiciliarioQuedaAsignado() throws Exception {
        createOrder(null);
        createOrder(luis.getId());
        mvc.perform(admin.with(get("/api/orders")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].estado").value("ASIGNADO"))
                .andExpect(jsonPath("$[0].domiciliarioNombre").value("Luis"))
                .andExpect(jsonPath("$[1].estado").value("PENDIENTE"));
    }

    @Test
    void validaLosCamposDelPedido() throws Exception {
        mvc.perform(admin.with(post("/api/orders"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("cliente", "", "telefono", "abc", "direccion", "Calle 1", "detalle", "x",
                        "totalCop", 0)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.cliente").exists())
                .andExpect(jsonPath("$.campos.telefono").exists())
                .andExpect(jsonPath("$.campos.totalCop").exists());
    }

    @Test
    void cadaDomiciliarioVeSoloSusPedidos() throws Exception {
        createOrder(luis.getId());
        createOrder(marta.getId());
        createOrder(null);
        // Ve el suyo y el que nadie ha tomado (sin teléfono), pero no el de Marta.
        mvc.perform(login("luis").with(get("/api/orders")))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[?(@.domiciliarioId == '" + marta.getId() + "')]").isEmpty());
    }

    @Test
    void losDisponiblesSeVenSinTelefonoYElPrimeroQueLosTomaSeQuedaConEl() throws Exception {
        String libre = createOrder(null);
        mvc.perform(login("luis").with(get("/api/orders")))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].estado").value("PENDIENTE"))
                .andExpect(jsonPath("$[0].telefono").value(""))
                .andExpect(jsonPath("$[0].direccion").value("Cra 5 #10-20"));

        Browser luisBrowser = login("luis");
        mvc.perform(luisBrowser.with(post("/api/orders/" + libre + "/tomar")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("ASIGNADO"))
                .andExpect(jsonPath("$.domiciliarioNombre").value("Luis"));
        // Ya es suyo: ahora sí ve el teléfono.
        mvc.perform(luisBrowser.with(get("/api/orders")))
                .andExpect(jsonPath("$[0].telefono").value("300 123 4567"));
        // Marta llega tarde: 409, y ya no lo ve disponible.
        Browser martaBrowser = login("marta");
        mvc.perform(martaBrowser.with(post("/api/orders/" + libre + "/tomar")))
                .andExpect(status().isConflict());
        mvc.perform(martaBrowser.with(get("/api/orders")))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void soloUnDomiciliarioPuedeTomarYNoUnPedidoYaAsignadoNiInexistente() throws Exception {
        String asignado = createOrder(marta.getId());
        mvc.perform(login("luis").with(post("/api/orders/" + asignado + "/tomar")))
                .andExpect(status().isConflict());
        mvc.perform(login("luis").with(post("/api/orders/no-existe/tomar")))
                .andExpect(status().isNotFound());
        String libre = createOrder(null);
        mvc.perform(admin.with(post("/api/orders/" + libre + "/tomar")))
                .andExpect(status().isForbidden());
    }

    @Test
    void laVentaEnLocalSeCierraAlCrearseSinDatosDelClienteYNadieLaToma() throws Exception {
        String body = mvc.perform(admin.with(post("/api/orders"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("tipo", "LOCAL", "detalle", "2 × Buñuelo", "totalCop", 5000)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipo").value("LOCAL"))
                .andExpect(jsonPath("$.estado").value("ENTREGADO"))
                .andExpect(jsonPath("$.cliente").value("Venta en local"))
                .andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(body, "$.id");
        // No aparece a los domiciliarios ni se puede tomar.
        mvc.perform(login("luis").with(get("/api/orders")))
                .andExpect(jsonPath("$.length()").value(0));
        mvc.perform(login("luis").with(post("/api/orders/" + id + "/tomar")))
                .andExpect(status().isConflict());
        // A domicilio sigue exigiendo los datos del cliente.
        mvc.perform(admin.with(post("/api/orders"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("tipo", "DOMICILIO", "detalle", "x", "totalCop", 1000)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.cliente").exists())
                .andExpect(jsonPath("$.campos.telefono").exists())
                .andExpect(jsonPath("$.campos.direccion").exists());
    }

    @Test
    void elDomiciliarioAvanzaSuPedidoPeroNoPuedeCancelarNiTocarAjenos() throws Exception {
        String suyo = createOrder(luis.getId());
        String ajeno = createOrder(marta.getId());
        Browser luisBrowser = login("luis");

        setStatus(luisBrowser, suyo, "ENTREGADO").andExpect(status().isConflict());
        setStatus(luisBrowser, suyo, "CANCELADO").andExpect(status().isConflict());
        setStatus(luisBrowser, suyo, "EN_CAMINO").andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("EN_CAMINO"));
        setStatus(luisBrowser, suyo, "ENTREGADO").andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("ENTREGADO"));

        setStatus(luisBrowser, ajeno, "EN_CAMINO").andExpect(status().isNotFound());
        mvc.perform(luisBrowser.with(post("/api/orders"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("cliente", "X", "telefono", "3001234567", "direccion", "Y", "detalle", "Z",
                        "totalCop", 1000)))
                .andExpect(status().isForbidden());
        mvc.perform(luisBrowser.with(put("/api/orders/" + ajeno + "/domiciliario"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("domiciliarioId", luis.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    void asignacionYCancelacionDelAdmin() throws Exception {
        String id = createOrder(null);
        mvc.perform(admin.with(put("/api/orders/" + id + "/domiciliario"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("domiciliarioId", marta.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("ASIGNADO"));

        // Quitar la asignación lo devuelve a pendiente.
        mvc.perform(admin.with(put("/api/orders/" + id + "/domiciliario"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("domiciliarioId", null)))
                .andExpect(jsonPath("$.estado").value("PENDIENTE"));

        setStatus(admin, id, "ENTREGADO").andExpect(status().isConflict());
        setStatus(admin, id, "CANCELADO").andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("CANCELADO"));
        setStatus(admin, id, "PENDIENTE").andExpect(status().isConflict());
        mvc.perform(admin.with(put("/api/orders/" + id + "/domiciliario"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("domiciliarioId", luis.getId())))
                .andExpect(status().isConflict());
    }

    @Test
    void noSeAsignaADomiciliariosInactivosNiAAdministradores() throws Exception {
        AppUser inactivo = createUser("inactivo", "Inactivo", Role.COURIER, false);
        String id = createOrder(null);
        for (String courierId : new String[] {inactivo.getId(), users.findByUsername("admin").orElseThrow().getId()}) {
            mvc.perform(admin.with(put("/api/orders/" + id + "/domiciliario"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json("domiciliarioId", courierId)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void elListadoDeDomiciliariosCuentaPedidosActivos() throws Exception {
        createOrder(luis.getId());
        String entregado = createOrder(luis.getId());
        setStatus(admin, entregado, "EN_CAMINO");
        setStatus(admin, entregado, "ENTREGADO");
        mvc.perform(admin.with(get("/api/couriers")))
                .andExpect(jsonPath("$[0].nombre").value("Luis"))
                .andExpect(jsonPath("$[0].pedidosActivos").value(1))
                .andExpect(jsonPath("$[0].password").doesNotExist());
    }

    @Test
    void alDesactivarUnDomiciliarioSusAsignadosVuelvenAPendientesYLosEnCaminoSeQuedan() throws Exception {
        String asignado = createOrder(luis.getId());
        String enCamino = createOrder(luis.getId());
        String deMarta = createOrder(marta.getId());
        setStatus(admin, enCamino, "EN_CAMINO").andExpect(status().isOk());

        mvc.perform(admin.with(patch("/api/couriers/" + luis.getId() + "/activo"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("activo", false)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activo").value(false))
                .andExpect(jsonPath("$.pedidosLiberados").value(1))
                .andExpect(jsonPath("$.pedidosActivos").value(1));

        String lista = mvc.perform(admin.with(get("/api/orders")))
                .andReturn().getResponse().getContentAsString();
        java.util.Map<String, Object> liberado = orderById(lista, asignado);
        org.junit.jupiter.api.Assertions.assertEquals("PENDIENTE", liberado.get("estado"));
        org.junit.jupiter.api.Assertions.assertNull(liberado.get("domiciliarioId"));
        org.junit.jupiter.api.Assertions.assertEquals("EN_CAMINO", orderById(lista, enCamino).get("estado"));
        org.junit.jupiter.api.Assertions.assertEquals("ASIGNADO", orderById(lista, deMarta).get("estado"));
    }

    private static java.util.Map<String, Object> orderById(String listJson, String id) {
        java.util.List<java.util.Map<String, Object>> found = JsonPath.read(listJson, "$[?(@.id=='" + id + "')]");
        return found.get(0);
    }

    @Test
    void elAdminEditaUnPedidoAbiertoSinCambiarEstadoNiDomiciliario() throws Exception {
        String id = createOrder(luis.getId());
        mvc.perform(admin.with(put("/api/orders/" + id))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("cliente", "Carmen R.", "telefono", "3001112233", "direccion", "Calle 9 #1-2",
                        "detalle", "24 buñuelos", "totalCop", 48000)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cliente").value("Carmen R."))
                .andExpect(jsonPath("$.totalCop").value(48000))
                .andExpect(jsonPath("$.estado").value("ASIGNADO"))
                .andExpect(jsonPath("$.domiciliarioNombre").value("Luis"));
    }

    @Test
    void alEditarUnPedidoSeRechazaCambiarSuTipo() throws Exception {
        String id = createOrder(luis.getId());
        mvc.perform(admin.with(put("/api/orders/" + id))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("tipo", "LOCAL", "detalle", "24 buñuelos", "totalCop", 48000)))
                .andExpect(status().isBadRequest());
        // Con su mismo tipo (o sin indicarlo, como un domicilio) sí se edita.
        mvc.perform(admin.with(put("/api/orders/" + id))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("tipo", "DOMICILIO", "cliente", "Carmen R.", "telefono", "3001112233",
                        "direccion", "Calle 9 #1-2", "detalle", "24 buñuelos", "totalCop", 48000)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("DOMICILIO"));
    }

    @Test
    void noSeEditaUnPedidoCerradoNiLoEditaUnDomiciliario() throws Exception {
        String id = createOrder(luis.getId());
        String body = json("cliente", "X", "telefono", "3001112233", "direccion", "Calle 9",
                "detalle", "y", "totalCop", 1000);
        mvc.perform(login("luis").with(put("/api/orders/" + id))
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        setStatus(admin, id, "CANCELADO").andExpect(status().isOk());
        mvc.perform(admin.with(put("/api/orders/" + id))
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
    }
}
