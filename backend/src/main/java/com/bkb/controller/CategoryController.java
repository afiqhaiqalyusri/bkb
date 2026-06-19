package com.bkb.controller;

import com.bkb.dto.response.ApiResponse;
import com.bkb.entity.Category;
import com.bkb.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(categoryRepository.findAllByOrderByDisplayOrderAsc()));
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Category>> create(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Category name is required"));
        }
        if (categoryRepository.existsByNameIgnoreCase(name.trim())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Category already exists"));
        }
        long nextOrder = categoryRepository.count() + 1;
        Category category = Category.builder()
                .name(name.trim())
                .displayOrder((int) nextOrder)
                .build();
        return ResponseEntity.ok(ApiResponse.success(categoryRepository.save(category)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        if (!categoryRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        categoryRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Category deleted", null));
    }
}
