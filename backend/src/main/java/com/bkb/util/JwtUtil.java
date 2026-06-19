package com.bkb.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String accessSecret;

    @Value("${jwt.refresh-secret}")
    private String refreshSecret;

    @Value("${jwt.access-token-expiry-ms}")
    private long accessTokenExpiryMs;

    @Value("${jwt.refresh-token-expiry-ms}")
    private long refreshTokenExpiryMs;

    // ─── Access Token ─────────────────────────────────────────────

    public String generateAccessToken(String email, String role, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("userId", userId);
        return buildToken(claims, email, accessSecret, accessTokenExpiryMs);
    }

    public Claims validateAccessToken(String token) {
        return parseClaims(token, accessSecret);
    }

    // ─── Refresh Token ────────────────────────────────────────────

    public String generateRefreshToken(String email) {
        return buildToken(new HashMap<>(), email, refreshSecret, refreshTokenExpiryMs);
    }

    public Claims validateRefreshToken(String token) {
        return parseClaims(token, refreshSecret);
    }

    // ─── Helpers ──────────────────────────────────────────────────

    private String buildToken(Map<String, Object> claims, String subject,
                              String secret, long expiryMs) {
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiryMs))
                .signWith(key)
                .compact();
    }

    private Claims parseClaims(String token, String secret) {
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractEmail(String token) {
        return validateAccessToken(token).getSubject();
    }

    public String extractRole(String token) {
        return (String) validateAccessToken(token).get("role");
    }

    public Long extractUserId(String token) {
        Object userId = validateAccessToken(token).get("userId");
        if (userId instanceof Integer) return ((Integer) userId).longValue();
        return (Long) userId;
    }

    public boolean isTokenExpired(String token) {
        try {
            parseClaims(token, accessSecret);
            return false;
        } catch (ExpiredJwtException e) {
            return true;
        } catch (JwtException e) {
            return true;
        }
    }

    public java.util.Date getExpirationDate(String token) {
        try {
            return parseClaims(token, accessSecret).getExpiration();
        } catch (ExpiredJwtException e) {
            return e.getClaims().getExpiration();
        }
    }
}
