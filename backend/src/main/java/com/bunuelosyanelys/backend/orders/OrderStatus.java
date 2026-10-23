package com.bunuelosyanelys.backend.orders;

public enum OrderStatus {
    PENDIENTE,
    ASIGNADO,
    EN_CAMINO,
    ENTREGADO,
    CANCELADO;

    public boolean isOpen() {
        return this == PENDIENTE || this == ASIGNADO || this == EN_CAMINO;
    }
}
