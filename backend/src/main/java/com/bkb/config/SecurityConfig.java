package com.bkb.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.XXssProtectionHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    /** BCrypt work factor — 12 is the recommended minimum for production. */
    private static final int BCRYPT_STRENGTH = 12;

    private final JwtAuthFilter jwtAuthFilter;
    private final RateLimitFilter rateLimitFilter;

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(BCRYPT_STRENGTH);
    }

    @Bean
    public RoleHierarchy roleHierarchy() {
        RoleHierarchyImpl hierarchy = new RoleHierarchyImpl();
        hierarchy.setHierarchy(
            "ROLE_ADMIN > ROLE_MANAGER\n" +
            "ROLE_MANAGER > ROLE_STAFF\n" +
            "ROLE_STAFF > ROLE_CUSTOMER\n" +
            "ROLE_CUSTOMER > ROLE_GUEST"
        );
        return hierarchy;
    }

    @Bean
    public static org.springframework.security.access.expression.method.MethodSecurityExpressionHandler
    methodSecurityExpressionHandler(RoleHierarchy roleHierarchy) {
        var handler = new org.springframework.security.access.expression.method
                .DefaultMethodSecurityExpressionHandler();
        handler.setRoleHierarchy(roleHierarchy);
        return handler;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // ── CSRF ─────────────────────────────────────────────
            // Disabled: stateless JWT API — CSRF tokens not applicable.
            // Mitigated by: SameSite cookie policy (handled by frontend),
            // JWT in Authorization header (not cookies), strict CORS origin check.
            .csrf(AbstractHttpConfigurer::disable)

            // ── CORS ─────────────────────────────────────────────
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // ── Sessions ─────────────────────────────────────────
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // ── Security Headers ──────────────────────────────────
            .headers(headers -> headers
                // Prevent clickjacking
                .frameOptions(frame -> frame.deny())
                // Prevent MIME sniffing
                .contentTypeOptions(cto -> {})
                // XSS filter header (legacy browsers)
                .xssProtection(xss -> xss.headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
                // Strict-Transport-Security (HSTS) — 1 year
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000)
                    .preload(true))
                // Referrer Policy
                .referrerPolicy(referrer -> referrer
                    .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                // Content Security Policy
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                    "default-src 'self'; " +
                    "script-src 'self'; " +
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                    "font-src 'self' https://fonts.gstatic.com; " +
                    "img-src 'self' data: https:; " +
                    "connect-src 'self'; " +
                    "frame-ancestors 'none'; " +
                    "base-uri 'self'; " +
                    "form-action 'self'"
                ))
                // Permissions Policy (formerly Feature-Policy)
                .permissionsPolicy(pp -> pp.policy(
                    "camera=(), microphone=(), geolocation=(), payment=()"
                ))
            )

            // ── Authorization Rules ───────────────────────────────
            .authorizeHttpRequests(auth -> auth
                // Auth endpoints — publicly accessible (rate-limited by RateLimitFilter)
                .requestMatchers("/api/auth/**").permitAll()

                // Public menu browsing
                .requestMatchers(HttpMethod.GET, "/api/menu/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/loyalty/rewards").permitAll()

                // Guest tracking
                .requestMatchers(HttpMethod.POST, "/api/orders", "/api/orders/create").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/orders/store-status").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/orders/track/*").permitAll()

                // Payment callbacks and redirects (from ToyyibPay - no auth)
                .requestMatchers("/api/payments/callback", "/api/payments/verify-redirect").permitAll()
                .requestMatchers(
                    "/api/payments/*/online-confirm",
                    "/api/payments/*/simulate-success",
                    "/api/payments/*/simulate-failure",
                    "/api/payments/*/status"
                ).permitAll()

                // Actuator — health only, publicly (for load balancer/uptime checks)
                .requestMatchers("/actuator/health", "/api/actuator/health").permitAll()

                // Swagger — only in dev (blocked in prod via application-prod.yml disabling the endpoints)
                .requestMatchers(
                    "/swagger-ui/**", "/swagger-ui.html",
                    "/v3/api-docs/**", "/webjars/**",
                    "/api/swagger-ui/**", "/api/swagger-ui.html",
                    "/api/v3/api-docs/**", "/api/webjars/**"
                ).permitAll()

                // Everything else requires authentication
                .anyRequest().authenticated()
            )

            // ── Filters ───────────────────────────────────────────
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        // Restrict to specific headers instead of wildcard
        config.setAllowedHeaders(List.of(
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "X-Requested-With",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
