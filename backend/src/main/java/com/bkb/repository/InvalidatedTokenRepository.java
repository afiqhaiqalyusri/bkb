package com.bkb.repository;

import com.bkb.entity.InvalidatedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface InvalidatedTokenRepository extends JpaRepository<InvalidatedToken, Long> {
    Optional<InvalidatedToken> findByToken(String token);
    boolean existsByToken(String token);
    void deleteByExpiryBefore(LocalDateTime dateTime);
}
