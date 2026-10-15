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
        mvc.perform(login("luis").with(get("/api/orders")))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].domiciliarioId").value(luis.getId()));
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
