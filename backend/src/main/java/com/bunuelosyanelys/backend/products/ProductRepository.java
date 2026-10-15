package com.bunuelosyanelys.backend.products;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ProductRepository extends MongoRepository<Product, String> {

    List<Product> findAllByOrderByNombreAsc(Pageable page);
}
