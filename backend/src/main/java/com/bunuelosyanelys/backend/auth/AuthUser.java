package com.bunuelosyanelys.backend.auth;

/** Usuario autenticado de la petición actual (principal de Spring Security). */
public record AuthUser(String id, String usuario, String nombre, Role role) {

    static AuthUser of(AppUser user) {
        return new AuthUser(user.getId(), user.getUsername(), user.getNombre(), user.getRole());
    }

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }
}
