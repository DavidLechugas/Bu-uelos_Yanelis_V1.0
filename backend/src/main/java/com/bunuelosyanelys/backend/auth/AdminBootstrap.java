package com.bunuelosyanelys.backend.auth;

import java.time.Clock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Alta del PRIMER administrador por procedimiento privado: solo si no
 * existe ninguno y están definidas {@code ADMIN_BOOTSTRAP_USERNAME} y
 * {@code ADMIN_BOOTSTRAP_PASSWORD} (variables de entorno de Render, nunca
 * en el repositorio). Sin cuenta ni contraseña de fábrica. Tras el primer
 * acceso conviene borrar las variables.
 */
@Component
class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final AppUserRepository users;
    private final PasswordEncoder encoder;
    private final Clock clock;
    private final String username;
    private final String password;
    private final String nombre;

    AdminBootstrap(AppUserRepository users, PasswordEncoder encoder, Clock clock,
            @Value("${ADMIN_BOOTSTRAP_USERNAME:}") String username,
            @Value("${ADMIN_BOOTSTRAP_PASSWORD:}") String password,
            @Value("${ADMIN_BOOTSTRAP_NAME:Administrador}") String nombre) {
        this.users = users;
        this.encoder = encoder;
        this.clock = clock;
        this.username = Credentials.normalizeUsername(username);
        this.password = password;
        this.nombre = nombre.isBlank() ? "Administrador" : nombre.trim();
    }

    @Override
    public void run(ApplicationArguments args) {
        if (users.existsByRole(Role.ADMIN)) {
            if (!username.isEmpty() || !password.isEmpty()) {
                log.info("Ya existe un administrador: se ignoran ADMIN_BOOTSTRAP_*. Puedes borrar esas variables.");
            }
            return;
        }
        if (username.isEmpty() || password.isEmpty()) {
            log.warn("No hay administrador. Define ADMIN_BOOTSTRAP_USERNAME y ADMIN_BOOTSTRAP_PASSWORD para crearlo.");
            return;
        }
        if (!username.matches(Credentials.USERNAME_PATTERN)
                || password.length() < Credentials.PASSWORD_MIN || password.length() > Credentials.PASSWORD_MAX) {
            log.error("ADMIN_BOOTSTRAP_* no válidas: {} {}", Credentials.USERNAME_MESSAGE, Credentials.PASSWORD_MESSAGE);
            return;
        }
        AppUser admin = new AppUser();
        admin.setUsername(username);
        admin.setNombre(nombre);
        admin.setPasswordHash(encoder.encode(password));
        admin.setRole(Role.ADMIN);
        admin.setActivo(true);
        admin.setCreadoEn(clock.instant());
        users.save(admin);
        log.info("Administrador inicial '{}' creado.", username);
    }
}
