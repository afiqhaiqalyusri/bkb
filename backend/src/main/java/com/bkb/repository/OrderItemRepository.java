package com.bkb.repository;

import com.bkb.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);

    @Query("SELECT oi.menuItem.id, oi.menuItem.name, SUM(oi.quantity) as totalQty, SUM(oi.quantity * oi.unitPrice) as totalRevenue " +
           "FROM OrderItem oi " +
           "JOIN oi.order o " +
           "WHERE o.createdAt BETWEEN :from AND :to " +
           "GROUP BY oi.menuItem.id, oi.menuItem.name " +
           "ORDER BY totalQty DESC")
    List<Object[]> findTopSellingItems(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
