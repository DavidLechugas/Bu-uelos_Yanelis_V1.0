package com.bunuelosyanelys.backend.auth;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** Usuario interno (administrador o domiciliario). Nunca se serializa a la API. */
@Document("users")
public class AppUser {

    @Id
    private String id;
    private String username;
    private String nombre;
    private String passwordHash;
    private Role role;
    private boolean activo;
    private Instant creadoEn;
    /** Foto de perfil pequeña como data URL (≤ 100 KB), opcional. */
    private String foto;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }
    public Instant getCreadoEn() { return creadoEn; }
    public void setCreadoEn(Instant creadoEn) { this.creadoEn = creadoEn; }
    public String getFoto() { return foto; }
    public void setFoto(String foto) { this.foto = foto; }
}
