package com.bunuelosyanelys.backend.common;

import org.springframework.http.HttpStatus;

/** Error de negocio con un mensaje apto para mostrarse en la interfaz. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
