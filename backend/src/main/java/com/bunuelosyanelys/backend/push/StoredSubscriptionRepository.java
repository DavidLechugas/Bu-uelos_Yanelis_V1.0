package com.bunuelosyanelys.backend.push;

import java.util.Collection;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

interface StoredSubscriptionRepository extends MongoRepository<StoredSubscription, String> {

    List<StoredSubscription> findByUserIdIn(Collection<String> userIds);

    long countByUserId(String userId);

    void deleteByUserId(String userId);

    void deleteByIdAndUserId(String id, String userId);
}
