package com.bunuelosyanelys.backend.auth;

public record AuthUser(String id, String usuario, String nombre, Role role, String foto, String telefono,
        String correo, String sexo) {

    static AuthUser of(AppUser user) {
        return new AuthUser(user.getId(), user.getUsername(), user.getNombre(), user.getRole(), user.getFoto(),
                user.getTelefono(), user.getCorreo(), user.getSexo());
    }

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }
}
