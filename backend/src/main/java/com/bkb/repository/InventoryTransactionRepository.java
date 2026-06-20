package com.bkb.repository;

import com.bkb.entity.InventoryTransaction;
import com.bkb.entity.enums.InventoryTransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    List<InventoryTransaction> findByInventoryIdOrderByCreatedAtDesc(Long inventoryId);

    @Query("SELECT t FROM InventoryTransaction t WHERE t.createdAt BETWEEN :from AND :to ORDER BY t.createdAt DESC")
    List<InventoryTransaction> findByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT t FROM InventoryTransaction t WHERE t.type = :type AND t.createdAt BETWEEN :from AND :to ORDER BY t.createdAt DESC")
    List<InventoryTransaction> findByTypeAndDateRange(
        @Param("type") InventoryTransactionType type,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to
    );

    @Query("SELECT t FROM InventoryTransaction t WHERE t.type = :type ORDER BY t.createdAt DESC")
    List<InventoryTransaction> findByType(@Param("type") InventoryTransactionType type);

    @Query("SELECT COALESCE(SUM(t.quantity), 0) FROM InventoryTransaction t WHERE t.inventory.id = :inventoryId AND t.type = :type AND t.createdAt BETWEEN :from AND :to")
    java.math.BigDecimal sumQuantityByInventoryIdAndTypeAndDateRange(
        @Param("inventoryId") Long inventoryId,
        @Param("type") InventoryTransactionType type,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to
    );

    @Query("SELECT COALESCE(SUM(t.transactionCost), 0) FROM InventoryTransaction t WHERE t.type = :type AND t.createdAt BETWEEN :from AND :to")
    java.math.BigDecimal sumTransactionCostByTypeAndDateRange(
        @Param("type") InventoryTransactionType type,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to
    );
}
