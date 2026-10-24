package com.bunuelosyanelys.backend.push;

import java.util.Collection;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

interface StoredSubscriptionRepository extends MongoRepository<StoredSubscription, String> {

    List<StoredSubscription> findByUserIdIn(Collection<String> userIds);

    void deleteByUserId(String userId);
}
