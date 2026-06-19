package com.bkb.controller;

import com.bkb.dto.request.*;
import com.bkb.dto.response.ApiResponse;
import com.bkb.dto.response.AuthResponse;
import com.bkb.dto.response.UserResponse;
import com.bkb.entity.User;
import com.bkb.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ── Registration ──────────────────────────────────────────

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(ApiResponse.success(
            "Registration successful. Please check your email for a verification code.", null));
    }

    // ── Email Verification ────────────────────────────────────

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        AuthResponse response = authService.verifyEmail(request);
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully. Welcome to BKB!", response));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Void>> resendVerification(@RequestParam String email) {
        authService.resendVerification(email);
        return ResponseEntity.ok(ApiResponse.success("Verification code resent. Please check your email.", null));
    }

    // ── Login ─────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    // ── Guest ─────────────────────────────────────────────────

    @PostMapping("/guest")
    public ResponseEntity<ApiResponse<AuthResponse>> guestSession(@Valid @RequestBody GuestSessionRequest request) {
        AuthResponse response = authService.createGuestSession(request);
        return ResponseEntity.ok(ApiResponse.success("Guest session created", response));
    }

    // ── Token Refresh ─────────────────────────────────────────

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshTokens(request);
        return ResponseEntity.ok(ApiResponse.success("Tokens refreshed", response));
    }

    // ── Logout ────────────────────────────────────────────────

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            HttpServletRequest request,
            @RequestBody(required = false) LogoutRequest logoutRequest,
            @RequestParam(value = "reason", required = false, defaultValue = "MANUAL") String reason) {

        String authHeader = request.getHeader("Authorization");
        String accessToken = null;
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            accessToken = authHeader.substring(7);
        }

        String refreshToken = logoutRequest != null ? logoutRequest.getRefreshToken() : null;

        if (accessToken != null) {
            authService.logout(accessToken, refreshToken, reason);
        }
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    // ── Password Reset ────────────────────────────────────────

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {
        authService.forgotPassword(request, extractClientIp(httpRequest));
        // Always return same response to prevent email enumeration
        return ResponseEntity.ok(ApiResponse.success(
            "If an account with that email exists, a password reset link has been sent.", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password has been reset successfully. Please log in with your new password.", null));
    }

    // ── Profile ───────────────────────────────────────────────

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(authService.getProfile(user.getEmail())));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse response = authService.updateProfile(user.getEmail(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(user.getEmail(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    // ── Helpers ───────────────────────────────────────────────

    private String extractClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) return realIp.trim();
        return request.getRemoteAddr();
    }
}
