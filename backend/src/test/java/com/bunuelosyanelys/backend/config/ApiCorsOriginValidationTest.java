package com.bunuelosyanelys.backend.config;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class ApiCorsOriginValidationTest {
    @Test
    void permiteOrigenHttpsExacto() {
        assertTrue(new ApiCorsConfig("https://bunuelos.pages.dev").isCorsEnabled());
    }

    @Test
    void sinOrigenNoHabilitaCors() {
        assertFalse(new ApiCorsConfig("").isCorsEnabled());
    }

    @ParameterizedTest
    @ValueSource(strings = {"*", "https://*.pages.dev", "http://bunuelos.pages.dev",
            "https://bunuelos.pages.dev/", "https://bunuelos.pages.dev/api",
            "https://bunuelos.pages.dev?x=1", "https://bunuelos.pages.dev#fragment",
            "https://usuario:clave@bunuelos.pages.dev"})
    void rechazaConfiguracionQueNoEsOrigenSeguro(String origin) {
        assertThrows(IllegalArgumentException.class, () -> new ApiCorsConfig(origin));
    }
}
