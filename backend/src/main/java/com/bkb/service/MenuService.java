package com.bkb.service;

import com.bkb.dto.request.MenuItemRequest;
import com.bkb.dto.response.MenuItemResponse;
import com.bkb.dto.response.PromotionResponse;
import com.bkb.entity.MenuItem;
import com.bkb.entity.MenuItemIngredient;
import com.bkb.entity.Promotion;
import com.bkb.entity.enums.IngredientLevel;
import com.bkb.exception.ResourceNotFoundException;
import com.bkb.repository.MenuItemRepository;
import com.bkb.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional(readOnly = true)
@Slf4j
public class MenuService {

    private final MenuItemRepository menuItemRepository;
    private final PromotionRepository promotionRepository;

    public List<MenuItemResponse> getAllAvailableItems() {
        return menuItemRepository.findByDeletedFalse()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<MenuItemResponse> getAllItems() {
        return menuItemRepository.findByDeletedFalse()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public MenuItemResponse getItemById(Long id) {
        MenuItem item = menuItemRepository.findByIdWithIngredients(id)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", id));
        return toResponse(item);
    }

    public List<String> getCategories() {
        return menuItemRepository.findDistinctCategories();
    }

    public List<PromotionResponse> getActivePromotions() {
        return promotionRepository.findActivePromotions(LocalDate.now())
                .stream().map(this::toPromotionResponse).collect(Collectors.toList());
    }

    @Transactional
    public MenuItemResponse createItem(MenuItemRequest request) {
        MenuItem item = buildFromRequest(new MenuItem(), request);
        item = menuItemRepository.save(item);
        log.info("Menu item created: {}", item.getName());
        return toResponse(item);
    }

    @Transactional
    public MenuItemResponse updateItem(Long id, MenuItemRequest request) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", id));
        item.getIngredients().clear();
        item = buildFromRequest(item, request);
        item = menuItemRepository.save(item);
        return toResponse(item);
    }

    @Transactional
    public void deleteItem(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", id));
        item.setDeleted(true);  // soft delete
        menuItemRepository.save(item);
    }

    @Transactional
    public MenuItemResponse toggleAvailability(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", id));
        item.setIsAvailable(!Boolean.TRUE.equals(item.getIsAvailable()));
        return toResponse(menuItemRepository.save(item));
    }

    // ─── Mapping Helpers ──────────────────────────────────────────

    private MenuItem buildFromRequest(MenuItem item, MenuItemRequest request) {
        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setPrice(request.getPrice());
        item.setPromoPrice(request.getPromoPrice());
        item.setCategory(request.getCategory());
        item.setImageUrl(request.getImageUrl());
        item.setIsAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true);

        if (item.getIngredients() == null) {
            item.setIngredients(new ArrayList<>());
        }

        if (request.getIngredients() != null) {
            request.getIngredients().forEach(ir -> {
                MenuItemIngredient ing = new MenuItemIngredient();
                ing.setMenuItem(item);
                ing.setIngredientName(ir.getIngredientName());
                try {
                    ing.setDefaultLevel(IngredientLevel.valueOf(
                            ir.getDefaultLevel() != null ? ir.getDefaultLevel() : "MEDIUM"));
                } catch (IllegalArgumentException e) {
                    ing.setDefaultLevel(IngredientLevel.MEDIUM);
                }
                item.getIngredients().add(ing);
            });
        }
        return item;
    }

    public MenuItemResponse toResponse(MenuItem item) {
        List<MenuItemResponse.IngredientResponse> ingredients = item.getIngredients() == null
                ? List.of()
                : item.getIngredients().stream()
                    .map(i -> MenuItemResponse.IngredientResponse.builder()
                            .id(i.getId())
                            .ingredientName(i.getIngredientName())
                            .defaultLevel(i.getDefaultLevel() != null ? i.getDefaultLevel().name() : "MEDIUM")
                            .build())
                    .collect(Collectors.toList());

        return MenuItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .price(item.getPrice())
                .promoPrice(item.getPromoPrice())
                .category(item.getCategory())
                .imageUrl(item.getImageUrl())
                .isAvailable(item.getIsAvailable())
                .createdAt(item.getCreatedAt())
                .ingredients(ingredients)
                .build();
    }

    private PromotionResponse toPromotionResponse(Promotion p) {
        return PromotionResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .discountType(p.getDiscountType() != null ? p.getDiscountType().name() : null)
                .discountValue(p.getDiscountValue())
                .isActive(p.getIsActive())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .build();
    }
}
