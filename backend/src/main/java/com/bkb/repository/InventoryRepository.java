package com.bkb.repository;

import com.bkb.entity.Inventory;
import com.bkb.entity.enums.InventoryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    List<Inventory> findByStatusIn(List<InventoryStatus> statuses);
    List<Inventory> findByCategory(String category);
    long countByStatus(InventoryStatus status);
}
