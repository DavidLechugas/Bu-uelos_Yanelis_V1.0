package com.bunuelosyanelys.backend.auth;

/** Usuario autenticado de la petición actual (principal de Spring Security). */
public record AuthUser(String id, String usuario, String nombre, Role role, String foto) {

    static AuthUser of(AppUser user) {
        return new AuthUser(user.getId(), user.getUsername(), user.getNombre(), user.getRole(), user.getFoto());
    }

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }
}
