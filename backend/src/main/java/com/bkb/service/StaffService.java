package com.bkb.service;

import com.bkb.dto.response.StaffResponse;
import com.bkb.entity.StaffDocument;
import com.bkb.entity.User;
import com.bkb.entity.enums.UserRole;
import com.bkb.exception.BkbException;
import com.bkb.exception.DuplicateResourceException;
import com.bkb.exception.ResourceNotFoundException;
import com.bkb.exception.UnauthorizedException;
import com.bkb.repository.StaffDocumentRepository;
import com.bkb.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Business logic for staff management operations.
 * Extracted from {@code StaffController} to satisfy the Single Responsibility Principle —
 * the controller handles HTTP concerns, this service owns the business rules.
 */
@Service
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class StaffService {

    private final UserRepository userRepository;
    private final StaffDocumentRepository staffDocumentRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityLogService securityLogService;

    /**
     * Retrieves all staff members.
     *
     * @param includeAll if true, returns all users (ADMIN view); otherwise only STAFF and MANAGER
     */
    public List<StaffResponse> getAllStaff(boolean includeAll) {
        List<User> users = includeAll
                ? userRepository.findAll()
                : userRepository.findByRoleIn(List.of(UserRole.STAFF, UserRole.MANAGER));

        return users.stream()
                .map(u -> {
                    StaffDocument doc = staffDocumentRepository.findByUserId(u.getId()).orElse(null);
                    return toStaffResponse(u, doc);
                })
                .collect(Collectors.toList());
    }

    /**
     * Creates a new staff account.
     *
     * @param body map of user fields from the request
     * @param callerIsAdmin whether the caller holds the ADMIN role
     * @throws BkbException if required fields are missing or the role is invalid
     * @throws DuplicateResourceException if the email is already registered
     * @throws UnauthorizedException if a non-admin attempts to create a manager/admin account
     */
    @Transactional
    public StaffResponse addStaff(Map<String, String> body, boolean callerIsAdmin) {
        String name = body.get("name");
        String email = body.get("email");
        String phone = body.get("phone");
        String password = body.get("password");
        String roleStr = body.get("role");

        if (name == null || name.isBlank() || email == null || email.isBlank()
                || password == null || password.isBlank()) {
            throw new BkbException("Name, email, and password are required");
        }

        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already exists: " + email);
        }

        UserRole role = UserRole.STAFF;
        if (roleStr != null) {
            try {
                role = UserRole.valueOf(roleStr.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        // Only ADMIN can create MANAGER or ADMIN accounts
        if (!callerIsAdmin && (role == UserRole.MANAGER || role == UserRole.ADMIN)) {
            throw new UnauthorizedException("Only admins can create manager or admin accounts");
        }

        // Public registration must be used for customer accounts
        if (role == UserRole.GUEST || role == UserRole.CUSTOMER) {
            throw new BkbException("Use the public registration endpoint for customer accounts");
        }

        User user = User.builder()
                .name(name)
                .email(email)
                .phone(phone)
                .passwordHash(passwordEncoder.encode(password))
                .role(role)
                .isActive(true)
                .build();

        return toStaffResponse(userRepository.save(user), null);
    }

    /**
     * Updates an existing user's profile fields, optionally resetting their password.
     * Emits security log entries for role changes and password resets.
     */
    @Transactional
    public StaffResponse updateUser(Long id, Map<String, String> body, User caller, HttpServletRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        String oldRole = user.getRole().name();
        String oldName = user.getName();
        String oldEmail = user.getEmail();
        String oldPhone = user.getPhone();

        StringBuilder changes = new StringBuilder();

        if (body.containsKey("name") && body.get("name") != null && !body.get("name").isBlank()) {
            String newName = body.get("name");
            if (!newName.equals(oldName)) {
                user.setName(newName);
                changes.append(String.format("Name: %s -> %s; ", oldName, newName));
            }
        }

        if (body.containsKey("email") && body.get("email") != null && !body.get("email").isBlank()) {
            String newEmail = body.get("email");
            if (!newEmail.equalsIgnoreCase(oldEmail)) {
                if (userRepository.existsByEmail(newEmail)) {
                    throw new DuplicateResourceException("Email already exists: " + newEmail);
                }
                user.setEmail(newEmail);
                changes.append(String.format("Email: %s -> %s; ", oldEmail, newEmail));
            }
        }

        if (body.containsKey("phone")) {
            String newPhone = body.get("phone");
            if ((newPhone == null && oldPhone != null) || (newPhone != null && !newPhone.equals(oldPhone))) {
                user.setPhone(newPhone);
                changes.append(String.format("Phone: %s -> %s; ", oldPhone, newPhone));
            }
        }

        if (body.containsKey("role") && body.get("role") != null) {
            try {
                UserRole role = UserRole.valueOf(body.get("role").toUpperCase());
                if (role != user.getRole()) {
                    String newRole = role.name();
                    user.setRole(role);
                    changes.append(String.format("Role: %s -> %s; ", oldRole, newRole));
                    securityLogService.log(caller, "Role Assignment",
                            String.format("Assigned new role %s to user %s.", newRole, user.getEmail()),
                            oldRole, newRole, request);
                }
            } catch (IllegalArgumentException ignored) {}
        }

        if (body.containsKey("password") && body.get("password") != null && !body.get("password").isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(body.get("password")));
            changes.append("Password Reset; ");
            securityLogService.log(caller, "Password Reset",
                    String.format("Reset password for user %s.", user.getEmail()),
                    null, null, request);
        }

        user = userRepository.save(user);

        if (changes.length() > 0) {
            securityLogService.log(caller, "User Update",
                    String.format("Updated user details for %s (ID: %d): %s", user.getEmail(), user.getId(), changes),
                    null, null, request);
        }

        StaffDocument doc = staffDocumentRepository.findByUserId(user.getId()).orElse(null);
        return toStaffResponse(user, doc);
    }

    /**
     * Permanently deletes a user and their associated staff document record.
     * Emits a security log entry for audit trail.
     */
    @Transactional
    public void deleteUser(Long id, User caller, HttpServletRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        staffDocumentRepository.findByUserId(id).ifPresent(staffDocumentRepository::delete);
        userRepository.delete(user);

        securityLogService.log(caller, "User Deletion",
                String.format("Permanently deleted user %s (ID: %d).", user.getEmail(), id),
                user.getEmail(), null, request);
    }

    /**
     * Toggles a user's active/suspended status and emits a security log entry.
     */
    @Transactional
    public void toggleStatus(Long id, User caller, HttpServletRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        boolean oldActive = Boolean.TRUE.equals(user.getIsActive());
        boolean newActive = !oldActive;
        user.setIsActive(newActive);
        userRepository.save(user);

        String details = String.format("Set user status of %s (ID: %d) to %s.",
                user.getEmail(), user.getId(), newActive ? "ACTIVE" : "SUSPENDED");
        securityLogService.log(caller, newActive ? "User Activation" : "User Suspension",
                details, String.valueOf(oldActive), String.valueOf(newActive), request);
    }

    /**
     * Creates or updates the staff document record for a user with the provided fields.
     * Only the fields present in the request body are updated.
     */
    @Transactional
    public void updateDocuments(Long id, Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        StaffDocument doc = staffDocumentRepository.findByUserId(id)
                .orElse(StaffDocument.builder().user(user).build());

        if (body.containsKey("icNumber")) {
            doc.setIcNumber(body.get("icNumber"));
        }
        if (body.containsKey("typhoidExpiry") && body.get("typhoidExpiry") != null
                && !body.get("typhoidExpiry").isBlank()) {
            doc.setTyphoidExpiry(LocalDate.parse(body.get("typhoidExpiry")));
        }
        if (body.containsKey("foodHandlerExpiry") && body.get("foodHandlerExpiry") != null
                && !body.get("foodHandlerExpiry").isBlank()) {
            doc.setFoodHandlerExpiry(LocalDate.parse(body.get("foodHandlerExpiry")));
        }
        if (body.containsKey("emergencyContactName")) {
            doc.setEmergencyContactName(body.get("emergencyContactName"));
        }
        if (body.containsKey("emergencyContactPhone")) {
            doc.setEmergencyContactPhone(body.get("emergencyContactPhone"));
        }
        if (body.containsKey("notes")) {
            doc.setNotes(body.get("notes"));
        }

        staffDocumentRepository.save(doc);
    }

    /**
     * Maps a User and an optional StaffDocument to a typed {@link StaffResponse}.
     * Document fields are null when no document record exists for the user.
     */
    private StaffResponse toStaffResponse(User user, StaffDocument doc) {
        StaffResponse.StaffResponseBuilder builder = StaffResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt());

        if (doc != null) {
            builder.icNumber(doc.getIcNumber())
                   .typhoidExpiry(doc.getTyphoidExpiry())
                   .foodHandlerExpiry(doc.getFoodHandlerExpiry())
                   .emergencyContactName(doc.getEmergencyContactName())
                   .emergencyContactPhone(doc.getEmergencyContactPhone())
                   .notes(doc.getNotes());
        }

        return builder.build();
    }
}
