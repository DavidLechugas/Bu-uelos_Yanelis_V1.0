package com.bunuelosyanelys.backend.dashboard;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface DashboardSnapshotRepository extends MongoRepository<DashboardSnapshot, String> {
}
