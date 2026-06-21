package com.bkb.repository;

import com.bkb.entity.Order;
import com.bkb.entity.enums.OrderStatus;
import com.bkb.entity.enums.PaymentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @EntityGraph(attributePaths = {"items", "items.menuItem"})
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"items", "items.menuItem"})
    Optional<Order> findByOrderNumber(String orderNumber);

    @EntityGraph(attributePaths = {"items", "items.menuItem"})
    Optional<Order> findByGuestToken(String guestToken);

    @EntityGraph(attributePaths = {"items", "items.menuItem"})
    List<Order> findByStatusOrderByCreatedAtAsc(OrderStatus status);

    @EntityGraph(attributePaths = {"items", "items.menuItem"})
    List<Order> findByStatusOrderByQueueEnteredAtAsc(OrderStatus status);

    @EntityGraph(attributePaths = {"items", "items.menuItem"})
    List<Order> findByStatusOrderByScheduledTimeAsc(OrderStatus status);

    @EntityGraph(attributePaths = {"items", "items.menuItem"})
    List<Order> findByStatusInOrderByCreatedAtAsc(List<OrderStatus> statuses);

    @EntityGraph(attributePaths = {"items", "items.menuItem"})
    List<Order> findAll();

    long countByStatus(OrderStatus status);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items i LEFT JOIN FETCH i.menuItem WHERE o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") Long id);

    @EntityGraph(attributePaths = {"items", "items.menuItem"})
    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :from AND :to ORDER BY o.createdAt DESC")
    List<Order> findByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :since AND o.paymentStatus = com.bkb.entity.enums.PaymentStatus.PAID")
    long countPaidSince(@Param("since") LocalDateTime since);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.createdAt >= :since AND o.paymentStatus = com.bkb.entity.enums.PaymentStatus.PAID")
    java.math.BigDecimal sumRevenueSince(@Param("since") LocalDateTime since);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.createdAt BETWEEN :from AND :to AND o.paymentStatus = com.bkb.entity.enums.PaymentStatus.PAID")
    java.math.BigDecimal sumRevenueBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COALESCE(SUM(o.estimatedProfit), 0) FROM Order o WHERE o.createdAt BETWEEN :from AND :to AND o.paymentStatus = com.bkb.entity.enums.PaymentStatus.PAID")
    java.math.BigDecimal sumProfitBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt BETWEEN :from AND :to AND o.paymentStatus = com.bkb.entity.enums.PaymentStatus.PAID")
    long countOrdersBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(DISTINCT o.user.id) FROM Order o WHERE o.createdAt BETWEEN :from AND :to AND o.paymentStatus = com.bkb.entity.enums.PaymentStatus.PAID AND o.user IS NOT NULL")
    long countUniqueCustomersBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query(value = "SELECT EXTRACT(HOUR FROM created_at) as hr, COUNT(*) as cnt FROM orders WHERE payment_status = 'PAID'::payment_status_type AND created_at BETWEEN :from AND :to GROUP BY hr ORDER BY cnt DESC", nativeQuery = true)
    List<Object[]> getPeakHours(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.paymentStatus = com.bkb.entity.enums.PaymentStatus.PAID AND o.user IS NOT NULL")
    java.math.BigDecimal sumUserRevenue();

    @Query(value = "SELECT COUNT(*) FROM (SELECT user_id FROM orders WHERE payment_status = 'PAID'::payment_status_type AND user_id IS NOT NULL GROUP BY user_id HAVING COUNT(*) > 1) AS repeat_cust", nativeQuery = true)
    long countRepeatCustomers();

    @Query("SELECT AVG(o.rating) FROM Order o WHERE o.rating IS NOT NULL")
    java.math.BigDecimal getAverageRating();

    @EntityGraph(attributePaths = {"user"})
    @Query("SELECT o FROM Order o WHERE o.rating IS NOT NULL ORDER BY o.createdAt DESC LIMIT 20")
    List<Order> findRecentFeedback();

    @Query("SELECT o.completedByName, COUNT(o.id) FROM Order o WHERE o.completedById IS NOT NULL AND o.createdAt BETWEEN :from AND :to GROUP BY o.completedByName ORDER BY COUNT(o.id) DESC")
    List<Object[]> getStaffPerformance(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
