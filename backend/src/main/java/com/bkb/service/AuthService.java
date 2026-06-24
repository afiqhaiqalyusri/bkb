package com.bkb.service;

import com.bkb.dto.request.*;
import com.bkb.dto.response.AuthResponse;
import com.bkb.dto.response.UserResponse;
import com.bkb.entity.*;
import com.bkb.entity.enums.UserRole;
import com.bkb.exception.DuplicateResourceException;
import com.bkb.exception.ResourceNotFoundException;
import com.bkb.exception.UnauthorizedException;
import com.bkb.repository.*;
import com.bkb.util.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final LoyaltyAccountRepository loyaltyAccountRepository;
    private final InvalidatedTokenRepository invalidatedTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final SecurityLogService securityLogService;
    private final SecurityTokenService securityTokenService;

    @Value("${app.security.otp-expiry-minutes:10}")
    private int otpExpiryMinutes;

    @Value("${app.security.otp-max-attempts:3}")
    private int otpMaxAttempts;

    @Value("${app.security.password-reset-expiry-minutes:15}")
    private int passwordResetExpiryMinutes;

    @Value("${app.security.password-reset-max-per-hour:3}")
    private int passwordResetMaxPerHour;

    @Value("${app.security.account-lockout-attempts:5}")
    private int lockoutAttempts;

    @Value("${app.security.account-lockout-minutes:15}")
    private int lockoutMinutes;

    @Value("${cors.allowed-origins:http://localhost:5173}")
    private String frontendUrl;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // ─── Registration ─────────────────────────────────────────

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }

        String otp = securityTokenService.generateOtp();
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail().toLowerCase())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.CUSTOMER)
                .isActive(true)
                .emailVerified(false)
                .verificationCode(securityTokenService.hashToken(otp))
                .verificationExpiry(LocalDateTime.now().plusMinutes(otpExpiryMinutes))
                .verificationAttempts(0)
                .build();

        user = userRepository.save(user);

        // Auto-create loyalty account (disabled until email verified)
        LoyaltyAccount account = LoyaltyAccount.builder()
                .user(user)
                .points(0)
                .totalEarned(0)
                .updatedAt(LocalDateTime.now())
                .build();
        loyaltyAccountRepository.save(account);

        // Send OTP email (async — non-blocking)
        emailService.sendVerificationOtp(user.getEmail(), user.getName(), otp);
        log.info("Registration initiated for: {} — OTP sent", user.getEmail());
    }

    // ─── Email Verification ───────────────────────────────────

    @Transactional
    public AuthResponse verifyEmail(VerifyEmailRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new UnauthorizedException("Invalid verification request"));

        if (user.isEmailVerified()) {
            throw new UnauthorizedException("Email is already verified");
        }

        if (user.getVerificationAttempts() >= otpMaxAttempts) {
            throw new UnauthorizedException("Maximum verification attempts exceeded. Please request a new code.");
        }

        if (user.getVerificationExpiry() == null || LocalDateTime.now().isAfter(user.getVerificationExpiry())) {
            throw new UnauthorizedException("Verification code has expired. Please request a new one.");
        }

        user.setVerificationAttempts(user.getVerificationAttempts() + 1);

        if (!securityTokenService.verifyHash(request.getCode(), user.getVerificationCode())) {
            userRepository.save(user);
            int remaining = otpMaxAttempts - user.getVerificationAttempts();
            throw new UnauthorizedException("Invalid verification code. " + remaining + " attempts remaining.");
        }

        // Success
        user.setEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationExpiry(null);
        user.setVerificationAttempts(0);
        userRepository.save(user);

        log.info("Email verified for: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    // ─── Resend OTP ───────────────────────────────────────────

    @Transactional
    public void resendVerification(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.isEmailVerified()) {
            throw new UnauthorizedException("Email is already verified");
        }

        String otp = securityTokenService.generateOtp();
        user.setVerificationCode(securityTokenService.hashToken(otp));
        user.setVerificationExpiry(LocalDateTime.now().plusMinutes(otpExpiryMinutes));
        user.setVerificationAttempts(0);
        userRepository.save(user);

        emailService.sendVerificationOtp(user.getEmail(), user.getName(), otp);
        log.info("Verification OTP resent to: {}", user.getEmail());
    }

    // ─── Login ────────────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        // Check if account is locked
        if (user.isAccountLocked()) {
            if (user.isLockExpired()) {
                // Auto-unlock after lockout period
                user.resetFailedAttempts();
                userRepository.save(user);
            } else {
                long minutesLeft = java.time.Duration.between(
                    LocalDateTime.now(), user.getLockTime().plusMinutes(lockoutMinutes)).toMinutes();
                throw new UnauthorizedException(
                    "Account is temporarily locked due to too many failed attempts. Try again in " + (minutesLeft + 1) + " minutes.");
            }
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new UnauthorizedException("Account is deactivated");
        }

        if (!user.isEmailVerified()) {
            throw new UnauthorizedException("Please verify your email before logging in. Check your inbox for the verification code.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            user.incrementFailedAttempts();
            userRepository.save(user);
            if (user.isAccountLocked()) {
                throw new UnauthorizedException("Too many failed login attempts. Account locked for " + lockoutMinutes + " minutes.");
            }
            int remaining = lockoutAttempts - user.getFailedAttempts();
            throw new UnauthorizedException("Invalid email or password. " + remaining + " attempts before lockout.");
        }

        // Successful login — reset failed attempts
        user.resetFailedAttempts();
        userRepository.save(user);

        log.info("Successful login: {}", user.getEmail());
        securityLogService.log(user, "LOGIN", "User logged in successfully", null, null, request.getEmail());
        return buildAuthResponse(user);
    }

    // ─── Guest Session ────────────────────────────────────────

    @Transactional
    public AuthResponse createGuestSession(GuestSessionRequest request) {
        String guestEmail = "guest_" + System.currentTimeMillis() + "_" + SECURE_RANDOM.nextInt(9999) + "@bkb.guest";
        User guest = User.builder()
                .name(request.getName())
                .email(guestEmail)
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(securityTokenService.generateSecureToken()))
                .role(UserRole.GUEST)
                .isActive(true)
                .emailVerified(true) // Guests bypass email verification
                .build();
        guest = userRepository.save(guest);
        return buildAuthResponse(guest);
    }

    // ─── Refresh Tokens (with rotation) ──────────────────────

    @Transactional
    public AuthResponse refreshTokens(RefreshTokenRequest request) {
        String rawToken = request.getRefreshToken();
        String tokenHash = securityTokenService.hashToken(rawToken);

        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired refresh token"));

        if (!storedToken.isValid()) {
            // Potential token reuse attack — revoke all tokens for the user
            if (storedToken.isRevoked()) {
                log.warn("SECURITY: Refresh token reuse detected for user id: {}", storedToken.getUser().getId());
                refreshTokenRepository.revokeAllByUserId(storedToken.getUser().getId());
            }
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        // Rotate: revoke old token
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        User user = storedToken.getUser();
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new UnauthorizedException("Account is deactivated");
        }

        return buildAuthResponse(user);
    }

    // ─── Forgot Password ─────────────────────────────────────

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request, String ipAddress) {
        // Rate limit by IP: max 3 per hour
        long recentByIp = passwordResetTokenRepository
                .countByIpAddressAndCreatedAtAfter(ipAddress, LocalDateTime.now().minusHours(1));
        if (recentByIp >= passwordResetMaxPerHour) {
            // Return same response to avoid IP enumeration — just log and silently skip
            log.warn("SECURITY: Password reset rate limit exceeded for IP: {}", ipAddress);
            return;
        }

        // Always return same response to prevent email enumeration
        userRepository.findByEmail(request.getEmail().toLowerCase()).ifPresent(user -> {
            // Rate limit by user: max 10 per day
            long recentByUser = passwordResetTokenRepository
                    .countByUserIdAndCreatedAtAfter(user.getId(), LocalDateTime.now().minusDays(1));
            if (recentByUser >= 10) {
                log.warn("SECURITY: Password reset daily limit exceeded for user: {}", user.getEmail());
                return;
            }

            // Invalidate all previous tokens for this user
            passwordResetTokenRepository.invalidateAllByUserId(user.getId());

            // Generate a cryptographically secure token
            String rawToken = securityTokenService.generateSecureToken();
            String tokenHash = securityTokenService.hashToken(rawToken);

            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .user(user)
                    .tokenHash(tokenHash)
                    .expiresAt(LocalDateTime.now().plusMinutes(passwordResetExpiryMinutes))
                    .used(false)
                    .ipAddress(ipAddress)
                    .build();
            passwordResetTokenRepository.save(resetToken);

            String baseUrl = frontendUrl.split(",")[0].trim();
            emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), rawToken, baseUrl);
            log.info("Password reset email sent to: {}", user.getEmail());
        });
    }

    // ─── Reset Password ───────────────────────────────────────

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String tokenHash = securityTokenService.hashToken(request.getToken());

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired reset token"));

        if (!resetToken.isValid()) {
            throw new UnauthorizedException("Reset token has expired or already been used");
        }

        User user = resetToken.getUser();

        // Mark token as used
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        // Update password
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.resetFailedAttempts(); // Unlock account if it was locked
        userRepository.save(user);

        // Revoke ALL refresh tokens (force re-login on all devices)
        refreshTokenRepository.revokeAllByUserId(user.getId());

        log.info("Password reset successfully for: {}", user.getEmail());
        securityLogService.log(user, "PASSWORD_RESET", "User reset password", null, null, "127.0.0.1");
    }

    // ─── Profile ──────────────────────────────────────────────

    public UserResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toUserResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(String currentEmail, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.getEmail().equalsIgnoreCase(request.getEmail()) &&
                userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }

        user.setName(request.getName());
        user.setEmail(request.getEmail().toLowerCase());
        user.setPhone(request.getPhone());
        user = userRepository.save(user);

        log.info("Profile updated for user: {}", user.getEmail());
        return toUserResponse(user);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Incorrect current password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Revoke all refresh tokens except current session (force re-login on other devices)
        refreshTokenRepository.revokeAllByUserId(user.getId());

        log.info("Password changed successfully for user: {}", email);
    }

    // ─── Logout ───────────────────────────────────────────────

    @Transactional
    public void logout(String accessToken, String refreshToken, String reason) {
        try {
            // Blacklist the access token
            java.util.Date expiryDate = jwtUtil.getExpirationDate(accessToken);
            LocalDateTime expiry = expiryDate.toInstant()
                    .atZone(java.time.ZoneId.systemDefault())
                    .toLocalDateTime();

            if (!invalidatedTokenRepository.existsByToken(accessToken)) {
                InvalidatedToken invalidated = InvalidatedToken.builder()
                        .token(accessToken)
                        .expiry(expiry)
                        .build();
                invalidatedTokenRepository.save(invalidated);
            }

            // Revoke the refresh token if provided
            if (refreshToken != null && !refreshToken.isBlank()) {
                String tokenHash = securityTokenService.hashToken(refreshToken);
                refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(rt -> {
                    rt.setRevoked(true);
                    refreshTokenRepository.save(rt);
                });
            }

            String email = "unknown";
            try { email = jwtUtil.extractEmail(accessToken); } catch (Exception ignored) {}
            log.info("Session destroyed ({}): User {} logged out.", reason, email);
            
            final String finalEmail = email;
            userRepository.findByEmail(email).ifPresent(user -> {
                securityLogService.log(user, "LOGOUT", "User logged out. Reason: " + reason, null, null, "127.0.0.1");
            });

        } catch (Exception e) {
            log.error("Failed to invalidate token during logout: {}", e.getMessage());
        }
    }

    // ─── Private Helpers ──────────────────────────────────────

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtUtil.generateAccessToken(
                user.getEmail(), user.getRole().name(), user.getId());

        // Generate a new refresh token and persist it
        String rawRefreshToken = securityTokenService.generateSecureToken();
        String tokenHash = securityTokenService.hashToken(rawRefreshToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .user(toUserResponse(user))
                .build();
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    }
