package com.bkb.repository;

import com.bkb.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("UPDATE PasswordResetToken prt SET prt.used = true WHERE prt.user.id = :userId AND prt.used = false")
    int invalidateAllByUserId(@Param("userId") Long userId);

    // Count reset requests from an IP within the last hour
    @Query("SELECT COUNT(prt) FROM PasswordResetToken prt WHERE prt.ipAddress = :ip AND prt.createdAt > :since")
    long countByIpAddressAndCreatedAtAfter(@Param("ip") String ip, @Param("since") LocalDateTime since);

    // Count reset requests for a user within the last day
    @Query("SELECT COUNT(prt) FROM PasswordResetToken prt WHERE prt.user.id = :userId AND prt.createdAt > :since")
    long countByUserIdAndCreatedAtAfter(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    @Modifying
    @Query("DELETE FROM PasswordResetToken prt WHERE prt.expiresAt < :cutoff")
    int deleteExpired(@Param("cutoff") LocalDateTime cutoff);
}
