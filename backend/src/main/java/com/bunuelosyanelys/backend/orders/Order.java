package com.bunuelosyanelys.backend.orders;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** Pedido. Contiene datos personales del cliente: solo se expone con sesión y permisos. */
@Document("orders")
public class Order {

    @Id
    private String id;
    private String cliente;
    private String telefono;
    private String direccion;
    private String detalle;
    private long totalCop;
    private OrderStatus estado;
    private String domiciliarioId;
    private String domiciliarioNombre;
    private Instant creadoEn;
    private Instant actualizadoEn;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCliente() { return cliente; }
    public void setCliente(String cliente) { this.cliente = cliente; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
    public String getDetalle() { return detalle; }
    public void setDetalle(String detalle) { this.detalle = detalle; }
    public long getTotalCop() { return totalCop; }
    public void setTotalCop(long totalCop) { this.totalCop = totalCop; }
    public OrderStatus getEstado() { return estado; }
    public void setEstado(OrderStatus estado) { this.estado = estado; }
    public String getDomiciliarioId() { return domiciliarioId; }
    public void setDomiciliarioId(String domiciliarioId) { this.domiciliarioId = domiciliarioId; }
    public String getDomiciliarioNombre() { return domiciliarioNombre; }
    public void setDomiciliarioNombre(String domiciliarioNombre) { this.domiciliarioNombre = domiciliarioNombre; }
    public Instant getCreadoEn() { return creadoEn; }
    public void setCreadoEn(Instant creadoEn) { this.creadoEn = creadoEn; }
    public Instant getActualizadoEn() { return actualizadoEn; }
    public void setActualizadoEn(Instant actualizadoEn) { this.actualizadoEn = actualizadoEn; }
}
