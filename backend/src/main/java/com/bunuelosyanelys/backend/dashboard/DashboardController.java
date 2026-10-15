package com.bunuelosyanelys.backend.dashboard;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bunuelosyanelys.backend.auth.AuthUser;
import com.bunuelosyanelys.backend.orders.Order;
import com.bunuelosyanelys.backend.orders.OrderRepository;
import com.bunuelosyanelys.backend.orders.OrderStatus;

/**
 * Tablero del administrador calculado en vivo a partir de los pedidos
 * (zona horaria de Colombia). Sustituye al snapshot de demostración; los
 * documentos antiguos de Atlas no se tocan.
 */
@RestController
@RequestMapping("/api")
public class DashboardController {

    static final ZoneId ZONE = ZoneId.of("America/Bogota");
    private static final String[] DAYS = {"Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"};

    public record VentaDiaria(String dia, long ventas) {
    }

    public record DashboardView(String saludo, long ventasTotales, long pedidos, long entregasActivas,
            long pendientesSinAsignar, List<VentaDiaria> ventasUltimos7Dias, Instant actualizadoEn) {
    }

    private final OrderRepository orders;
    private final Clock clock;

    public DashboardController(OrderRepository orders, Clock clock) {
        this.orders = orders;
        this.clock = clock;
    }

    @GetMapping("/dashboard")
    public DashboardView dashboard(@AuthenticationPrincipal AuthUser user) {
        ZonedDateTime now = clock.instant().atZone(ZONE);
        LocalDate today = now.toLocalDate();
        Instant weekStart = today.minusDays(6).atStartOfDay(ZONE).toInstant();

        // Ventas = pedidos ENTREGADOS, por día de entrega (actualizadoEn).
        Map<LocalDate, Long> perDay = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            perDay.put(today.minusDays(i), 0L);
        }
        for (Order order : orders.findByEstadoAndActualizadoEnGreaterThanEqual(OrderStatus.ENTREGADO, weekStart)) {
            perDay.computeIfPresent(order.getActualizadoEn().atZone(ZONE).toLocalDate(),
                    (day, total) -> total + order.getTotalCop());
        }
        List<VentaDiaria> days = new ArrayList<>();
        perDay.forEach((day, total) -> days.add(new VentaDiaria(label(day.getDayOfWeek()), total)));

        return new DashboardView(
                greeting(now.getHour()) + ", " + user.nombre(),
                perDay.values().stream().mapToLong(Long::longValue).sum(),
                orders.countByCreadoEnGreaterThanEqual(today.atStartOfDay(ZONE).toInstant()),
                orders.countByEstadoIn(EnumSet.of(OrderStatus.ASIGNADO, OrderStatus.EN_CAMINO)),
                orders.countByEstado(OrderStatus.PENDIENTE),
                days,
                clock.instant());
    }

    static String greeting(int hour) {
        if (hour >= 5 && hour < 12) {
            return "Buenos días";
        }
        return hour >= 12 && hour < 19 ? "Buenas tardes" : "Buenas noches";
    }

    private static String label(DayOfWeek day) {
        return DAYS[day.getValue() - 1];
    }
}
