package com.bunuelosyanelys.backend.auth;

import org.springframework.stereotype.Component;

/** La cuenta principal es el administrador más antiguo: no hace falta migrar datos existentes. */
@Component
public class PrincipalAdmin {

    private final AppUserRepository users;

    PrincipalAdmin(AppUserRepository users) {
        this.users = users;
    }

    public boolean is(AppUser user) {
        return user.getRole() == Role.ADMIN
                && users.findFirstByRoleOrderByCreadoEnAscIdAsc(Role.ADMIN)
                        .map(first -> first.getId().equals(user.getId()))
                        .orElse(false);
    }
}
