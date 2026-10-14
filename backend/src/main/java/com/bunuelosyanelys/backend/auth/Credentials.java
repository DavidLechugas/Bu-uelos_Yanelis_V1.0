package com.bunuelosyanelys.backend.auth;

import java.util.Locale;

/** Reglas compartidas de usuario y contraseña. */
public final class Credentials {

    public static final String USERNAME_PATTERN = "[a-z0-9._-]{3,30}";
    public static final String USERNAME_MESSAGE =
            "Usa de 3 a 30 letras minúsculas, números, punto, guion o guion bajo.";
    public static final int PASSWORD_MIN = 8;
    /** BCrypt solo considera los primeros 72 bytes. */
    public static final int PASSWORD_MAX = 72;
    public static final String PASSWORD_MESSAGE = "La contraseña debe tener entre 8 y 72 caracteres.";

    private Credentials() {
    }

    public static String normalizeUsername(String username) {
        return username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
    }
}
