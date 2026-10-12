package com.bunuelosyanelys.backend.dashboard;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Snapshot único del tablero de demostración.
 *
 * <p>Fuente de datos real: colección {@code dashboard_snapshot} de la base
 * {@code bunuelos_yanelys} (MongoDB local). La semilla de demostración solo se
 * inserta en el perfil {@code dev} y nunca sobrescribe un documento existente.
 */
@Document(collection = "dashboard_snapshot")
public class DashboardSnapshot {

    @Id
    private String id;

    private String saludo;
    private int ventasTotales;
    private int pedidos;
    private int alertas;
    private int entregasActivas;
    private List<InventarioBajo> inventarioBajo;
    private List<VentaDiaria> ventasUltimos7Dias;

    public DashboardSnapshot() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSaludo() {
        return saludo;
    }

    public void setSaludo(String saludo) {
        this.saludo = saludo;
    }

    public int getVentasTotales() {
        return ventasTotales;
    }

    public void setVentasTotales(int ventasTotales) {
        this.ventasTotales = ventasTotales;
    }

    public int getPedidos() {
        return pedidos;
    }

    public void setPedidos(int pedidos) {
        this.pedidos = pedidos;
    }

    public int getAlertas() {
        return alertas;
    }

    public void setAlertas(int alertas) {
        this.alertas = alertas;
    }

    public int getEntregasActivas() {
        return entregasActivas;
    }

    public void setEntregasActivas(int entregasActivas) {
        this.entregasActivas = entregasActivas;
    }

    public List<InventarioBajo> getInventarioBajo() {
        return inventarioBajo;
    }

    public void setInventarioBajo(List<InventarioBajo> inventarioBajo) {
        this.inventarioBajo = inventarioBajo;
    }

    public List<VentaDiaria> getVentasUltimos7Dias() {
        return ventasUltimos7Dias;
    }

    public void setVentasUltimos7Dias(List<VentaDiaria> ventasUltimos7Dias) {
        this.ventasUltimos7Dias = ventasUltimos7Dias;
    }

    /** Producto con stock bajo destacado en el tablero. */
    public static class InventarioBajo {

        private String producto;
        private int unidades;
        private String mensaje;

        public InventarioBajo() {
        }

        public InventarioBajo(String producto, int unidades, String mensaje) {
            this.producto = producto;
            this.unidades = unidades;
            this.mensaje = mensaje;
        }

        public String getProducto() {
            return producto;
        }

        public void setProducto(String producto) {
            this.producto = producto;
        }

        public int getUnidades() {
            return unidades;
        }

        public void setUnidades(int unidades) {
            this.unidades = unidades;
        }

        public String getMensaje() {
            return mensaje;
        }

        public void setMensaje(String mensaje) {
            this.mensaje = mensaje;
        }
    }

    /** Venta diaria para la gráfica de los últimos 7 días. */
    public static class VentaDiaria {

        private String dia;
        private int ventas;

        public VentaDiaria() {
        }

        public VentaDiaria(String dia, int ventas) {
            this.dia = dia;
            this.ventas = ventas;
        }

        public String getDia() {
            return dia;
        }

        public void setDia(String dia) {
            this.dia = dia;
        }

        public int getVentas() {
            return ventas;
        }

        public void setVentas(int ventas) {
            this.ventas = ventas;
        }
    }
}
