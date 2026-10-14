package com.bunuelosyanelys.backend.auth;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface AppUserRepository extends MongoRepository<AppUser, String> {

    Optional<AppUser> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByRole(Role role);

    List<AppUser> findByRoleOrderByNombreAsc(Role role);
}
