package com.bkb.service;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Random;

@Service
public class SecurityTokenService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public String generateOtp() {
        Random random = new Random(SECURE_RANDOM.nextLong());
        return String.format("%06d", random.nextInt(1_000_000));
    }

    public String hashToken(String token) {
        return sha256(token);
    }

    public boolean verifyHash(String rawInput, String storedHash) {
        if (storedHash == null) return false;
        return sha256(rawInput).equals(storedHash);
    }

    public String generateSecureToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
