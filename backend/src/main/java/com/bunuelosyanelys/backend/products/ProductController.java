package com.bunuelosyanelys.backend.products;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.bunuelosyanelys.backend.common.ApiException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Catálogo de productos (solo administrador, ver SecurityConfig). */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private static final int LIST_LIMIT = 200;

    public record ProductRequest(
            @NotBlank(message = "Escribe un nombre.")
            @Size(max = 100, message = "Máximo 100 caracteres.") String nombre,
            @Size(max = 240, message = "Máximo 240 caracteres.") String descripcion,
            @NotNull(message = "Escribe el precio.")
            @Min(value = 1, message = "El precio debe ser mayor que 0.")
            @Max(value = 100_000_000, message = "El precio es demasiado alto.") Long precio,
            Boolean disponible) {
    }

    private final ProductRepository products;

    public ProductController(ProductRepository products) {
        this.products = products;
    }

    @GetMapping
    public List<Product> list() {
        return products.findAllByOrderByNombreAsc(PageRequest.of(0, LIST_LIMIT));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Product create(@Valid @RequestBody ProductRequest request) {
        return products.save(apply(new Product(), request));
    }

    @PutMapping("/{id}")
    public Product update(@PathVariable String id, @Valid @RequestBody ProductRequest request) {
        Product product = products.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Producto no encontrado."));
        return products.save(apply(product, request));
    }

    private Product apply(Product product, ProductRequest request) {
        product.setNombre(request.nombre().trim());
        product.setDescripcion(request.descripcion() == null ? "" : request.descripcion().trim());
        product.setPrecio(request.precio());
        product.setDisponible(request.disponible() == null || request.disponible());
        return product;
    }
}
