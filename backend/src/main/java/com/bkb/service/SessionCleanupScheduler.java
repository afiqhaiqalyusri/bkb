package com.bkb.service;

import com.bkb.repository.InvalidatedTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionCleanupScheduler {

    private final InvalidatedTokenRepository invalidatedTokenRepository;

    @Scheduled(cron = "0 */10 * * * *") // Runs every 10 minutes
    @Transactional
    public void cleanupExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        invalidatedTokenRepository.deleteByExpiryBefore(now);
        log.info("Cleaned up expired blacklisted session tokens older than {}", now);
    }
}
