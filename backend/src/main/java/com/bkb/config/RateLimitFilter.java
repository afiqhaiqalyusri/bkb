package com.bkb.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Bucket4j-based rate limiter applied to sensitive auth endpoints.
 *
 * Limits:
 *  - /api/auth/login         → 5 requests per minute per IP
 *  - /api/auth/register      → 3 requests per minute per IP
 *  - /api/auth/refresh       → 10 requests per minute per IP
 *  - /api/auth/forgot-password → 3 requests per minute per IP
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    // In-memory bucket cache: key = "IP:endpoint"
    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String ip = extractClientIp(request);
        String bucketKey = ip + ":" + normalizePath(path);

        Bucket bucket = buckets.computeIfAbsent(bucketKey, k -> createBucketFor(path));

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            log.warn("SECURITY: Rate limit exceeded. IP: {}, Path: {}", ip, path);
            sendRateLimitResponse(response);
        }
    }

    private Bucket createBucketFor(String path) {
        Bandwidth limit;

        if (path.contains("/login")) {
            // 5 attempts per minute
            limit = Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(1)));
        } else if (path.contains("/register")) {
            // 3 registrations per minute
            limit = Bandwidth.classic(3, Refill.greedy(3, Duration.ofMinutes(1)));
        } else if (path.contains("/forgot-password")) {
            // 3 reset requests per minute
            limit = Bandwidth.classic(3, Refill.greedy(3, Duration.ofMinutes(1)));
        } else if (path.contains("/refresh")) {
            // 10 refreshes per minute
            limit = Bandwidth.classic(10, Refill.greedy(10, Duration.ofMinutes(1)));
        } else if (path.contains("/verify-email") || path.contains("/resend-verification")) {
            // 5 OTP submissions per 5 minutes
            limit = Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(5)));
        } else {
            // Default: 20 per minute for other auth endpoints
            limit = Bandwidth.classic(20, Refill.greedy(20, Duration.ofMinutes(1)));
        }

        return Bucket.builder().addLimit(limit).build();
    }

    private String normalizePath(String path) {
        // Normalize to avoid cache explosion from parameterized paths
        if (path.contains("/login")) return "/login";
        if (path.contains("/register")) return "/register";
        if (path.contains("/refresh")) return "/refresh";
        if (path.contains("/logout")) return "/logout";
        if (path.contains("/forgot-password")) return "/forgot-password";
        if (path.contains("/reset-password")) return "/reset-password";
        if (path.contains("/verify-email")) return "/verify-email";
        if (path.contains("/resend-verification")) return "/resend-verification";
        return path;
    }

    private String extractClientIp(HttpServletRequest request) {
        // Respect X-Forwarded-For from Nginx proxy
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }

    private void sendRateLimitResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        Map<String, Object> body = Map.of(
                "status", 429,
                "error", "Too Many Requests",
                "message", "You have exceeded the request limit. Please wait before trying again."
        );
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
