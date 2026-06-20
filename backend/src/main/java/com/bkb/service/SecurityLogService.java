package com.bkb.service;

import com.bkb.entity.SecurityLog;
import com.bkb.entity.User;
import com.bkb.repository.SecurityLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityLogService {

    private final SecurityLogRepository securityLogRepository;

    @Transactional
    public void log(User user, String action, String details, String prevVal, String newVal, HttpServletRequest request) {
        String ipAddress = "unknown";
        if (request != null) {
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                ipAddress = xForwardedFor.split(",")[0].trim();
            } else {
                ipAddress = request.getRemoteAddr();
            }
        }
        log(user, action, details, prevVal, newVal, ipAddress);
    }

    @Transactional
    public void log(User user, String action, String details, String prevVal, String newVal, String ipAddress) {
        try {
            if (ipAddress == null || ipAddress.isBlank()) {
                ipAddress = "unknown";
            }

            SecurityLog securityLog = SecurityLog.builder()
                    .user(user)
                    .userEmail(user != null ? user.getEmail() : "system")
                    .userRole(user != null && user.getRole() != null ? user.getRole().name() : "SYSTEM")
                    .action(action)
                    .details(details)
                    .previousValue(prevVal)
                    .newValue(newVal)
                    .ipAddress(ipAddress)
                    .build();

            securityLogRepository.save(securityLog);
            log.info("Security Audit Log saved - User: {}, Action: {}, Details: {}, IP: {}",
                    user != null ? user.getEmail() : "system", action, details, ipAddress);
        } catch (Exception e) {
            log.error("Failed to persist security audit log: {}", e.getMessage(), e);
        }
    }
}
