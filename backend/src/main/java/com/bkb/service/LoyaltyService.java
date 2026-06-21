package com.bkb.service;

import com.bkb.dto.response.LoyaltyAccountResponse;
import com.bkb.dto.response.LoyaltyRewardResponse;
import com.bkb.entity.*;
import com.bkb.entity.enums.LoyaltyTransactionType;
import com.bkb.exception.BkbException;
import com.bkb.exception.InsufficientPointsException;
import com.bkb.exception.ResourceNotFoundException;
import com.bkb.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional(readOnly = true)
@Slf4j
public class LoyaltyService {

    private final LoyaltyAccountRepository accountRepository;
    private final LoyaltyTransactionRepository transactionRepository;
    private final LoyaltyRewardRepository rewardRepository;
    private final UserRepository userRepository;
    private final MenuItemRepository menuItemRepository;

    @Value("${bkb.loyalty.rm-per-point:10}")
    private int rmPerPoint;

    /**
     * Get or create loyalty account for a user.
     */
    @Transactional
    public LoyaltyAccount getOrCreateAccount(User user) {
        return accountRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    User managedUser = userRepository.findById(user.getId())
                            .orElseThrow(() -> new ResourceNotFoundException("User", user.getId()));
                    LoyaltyAccount account = LoyaltyAccount.builder()
                            .user(managedUser)
                            .points(0)
                            .totalEarned(0)
                            .updatedAt(LocalDateTime.now())
                            .build();
                    return accountRepository.save(account);
                });
    }

    /**
     * Calculate and award points after a successful order.
     * 1 point per RM10 spent.
     */
    @Transactional
    public void awardPoints(User user, Order order) {
        if (user == null) return;

        LoyaltyAccount account = getOrCreateAccount(user);
        int pointsEarned = calculatePoints(order.getTotal());

        if (pointsEarned <= 0) return;

        account.setPoints(account.getPoints() + pointsEarned);
        account.setTotalEarned(account.getTotalEarned() + pointsEarned);
        account.setUpdatedAt(LocalDateTime.now());
        accountRepository.save(account);

        LoyaltyTransaction tx = LoyaltyTransaction.builder()
                .account(account)
                .type(LoyaltyTransactionType.EARN)
                .points(pointsEarned)
                .order(order)
                .build();
        transactionRepository.save(tx);

        log.info("Awarded {} points to {} for order {}", pointsEarned, user.getEmail(), order.getOrderNumber());
    }

    public int calculatePoints(BigDecimal totalAmount) {
        if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) <= 0) return 0;
        return totalAmount.divideToIntegralValue(BigDecimal.valueOf(rmPerPoint)).intValue();
    }

    @Transactional
    public void adjustPoints(Long accountId, int pointsDelta, String reason) {
        LoyaltyAccount account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Loyalty account not found for ID: " + accountId));

        account.setPoints(Math.max(0, account.getPoints() + pointsDelta));
        if (pointsDelta > 0) {
            account.setTotalEarned(account.getTotalEarned() + pointsDelta);
        }
        account.setUpdatedAt(LocalDateTime.now());
        accountRepository.save(account);

        LoyaltyTransaction tx = LoyaltyTransaction.builder()
                .account(account)
                .type(pointsDelta >= 0 ? LoyaltyTransactionType.EARN : LoyaltyTransactionType.REDEEM)
                .points(pointsDelta)
                .build();
        transactionRepository.save(tx);
        log.info("Adjusted loyalty points for account {}: {} points. Reason: {}", accountId, pointsDelta, reason);
    }

    @Transactional
    public void redeemReward(User user, Long rewardId) {
        LoyaltyReward reward = rewardRepository.findById(rewardId)
                .orElseThrow(() -> new ResourceNotFoundException("Reward", rewardId));

        if (!Boolean.TRUE.equals(reward.getIsActive())) {
            throw new BkbException("This reward is no longer available");
        }

        LoyaltyAccount account = accountRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Loyalty account not found for user: " + user.getEmail()));

        if (account.getPoints() < reward.getPointsCost()) {
            throw new InsufficientPointsException(reward.getPointsCost(), account.getPoints());
        }

        account.setPoints(account.getPoints() - reward.getPointsCost());
        account.setUpdatedAt(LocalDateTime.now());
        accountRepository.save(account);

        LoyaltyTransaction tx = LoyaltyTransaction.builder()
                .account(account)
                .type(LoyaltyTransactionType.REDEEM)
                .points(-reward.getPointsCost())
                .build();
        transactionRepository.save(tx);

        log.info("User {} redeemed reward '{}' for {} points", user.getEmail(), reward.getName(), reward.getPointsCost());
    }

    public LoyaltyAccountResponse getAccountForUser(User user) {
        LoyaltyAccount account = accountRepository.findByUserId(user.getId())
                .orElse(LoyaltyAccount.builder().points(0).totalEarned(0).build());

        List<LoyaltyAccountResponse.LoyaltyTransactionResponse> txList = account.getId() == null
                ? List.of()
                : transactionRepository.findByAccountIdOrderByCreatedAtDesc(account.getId())
                    .stream().map(tx -> LoyaltyAccountResponse.LoyaltyTransactionResponse.builder()
                            .id(tx.getId())
                            .type(tx.getType().name())
                            .points(tx.getPoints())
                            .orderNumber(tx.getOrder() != null ? tx.getOrder().getOrderNumber() : null)
                            .createdAt(tx.getCreatedAt())
                            .build())
                    .collect(Collectors.toList());

        return LoyaltyAccountResponse.builder()
                .id(account.getId())
                .points(account.getPoints())
                .totalEarned(account.getTotalEarned())
                .updatedAt(account.getUpdatedAt())
                .transactions(txList)
                .build();
    }

    public List<LoyaltyRewardResponse> getAllActiveRewards() {
        return rewardRepository.findByIsActiveTrue().stream()
                .map(this::toRewardResponse)
                .collect(Collectors.toList());
    }

    public List<LoyaltyRewardResponse> getAllRewards() {
        return rewardRepository.findAll().stream()
                .map(this::toRewardResponse)
                .collect(Collectors.toList());
    }

    // ─── Manager operations ──────────────────────────────────────

    @Transactional
    public LoyaltyRewardResponse createReward(String name, int pointsCost, Long menuItemId,
                                               String description, String imageUrl) {
        MenuItem menuItem = menuItemId != null
                ? menuItemRepository.findById(menuItemId).orElse(null)
                : null;

        LoyaltyReward reward = LoyaltyReward.builder()
                .name(name)
                .pointsCost(pointsCost)
                .menuItem(menuItem)
                .isActive(true)
                .description(description)
                .imageUrl(imageUrl)
                .build();

        return toRewardResponse(rewardRepository.save(reward));
    }

    @Transactional
    public LoyaltyRewardResponse updateReward(Long id, Map<String, Object> updates) {
        LoyaltyReward reward = rewardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reward", id));

        if (updates.containsKey("name")) reward.setName((String) updates.get("name"));
        if (updates.containsKey("pointsCost")) reward.setPointsCost(Integer.parseInt(updates.get("pointsCost").toString()));
        if (updates.containsKey("isActive")) reward.setIsActive((Boolean) updates.get("isActive"));
        if (updates.containsKey("description")) reward.setDescription((String) updates.get("description"));
        if (updates.containsKey("imageUrl")) reward.setImageUrl((String) updates.get("imageUrl"));
        if (updates.containsKey("menuItemId")) {
            if (updates.get("menuItemId") == null) {
                reward.setMenuItem(null);
            } else {
                Long menuItemId = Long.parseLong(updates.get("menuItemId").toString());
                reward.setMenuItem(menuItemRepository.findById(menuItemId).orElse(null));
            }
        }

        return toRewardResponse(rewardRepository.save(reward));
    }

    @Transactional
    public void deleteReward(Long id) {
        if (!rewardRepository.existsById(id)) {
            throw new ResourceNotFoundException("Reward", id);
        }
        rewardRepository.deleteById(id);
    }

    /**
     * Returns all loyalty accounts with user details for the manager dashboard.
     */
    public List<Map<String, Object>> getAllAccountsForManager() {
        return accountRepository.findAll().stream().map(acc -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", acc.getId());
            m.put("userName", acc.getUser() != null ? acc.getUser().getName() : "");
            m.put("userEmail", acc.getUser() != null ? acc.getUser().getEmail() : "");
            m.put("points", acc.getPoints());
            m.put("totalEarned", acc.getTotalEarned());
            m.put("updatedAt", acc.getUpdatedAt());
            m.put("userRole", acc.getUser() != null && acc.getUser().getRole() != null
                    ? acc.getUser().getRole().name() : "CUSTOMER");
            m.put("phone", acc.getUser() != null ? acc.getUser().getPhone() : "");
            return m;
        }).toList();
    }

    /**
     * Maps a {@link LoyaltyReward} to its response DTO.
     * Centralised to avoid duplicating the mapping lambda in getAllActiveRewards and getAllRewards.
     */
    private LoyaltyRewardResponse toRewardResponse(LoyaltyReward r) {
        return LoyaltyRewardResponse.builder()
                .id(r.getId())
                .name(r.getName())
                .pointsCost(r.getPointsCost())
                .isActive(r.getIsActive())
                .menuItemId(r.getMenuItem() != null ? r.getMenuItem().getId() : null)
                .menuItemName(r.getMenuItem() != null ? r.getMenuItem().getName() : null)
                .menuItemImageUrl(r.getMenuItem() != null ? r.getMenuItem().getImageUrl() : null)
                .description(r.getDescription())
                .imageUrl(r.getImageUrl())
                .build();
    }
}
