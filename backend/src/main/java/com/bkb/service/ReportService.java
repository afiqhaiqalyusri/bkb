package com.bkb.service;

import com.bkb.dto.response.CustomerInsightsResponse;
import com.bkb.dto.response.ExecutiveDashboardResponse;
import com.bkb.dto.response.MenuAnalyticsResponse;
import com.bkb.dto.response.SalesReportResponse;
import com.bkb.repository.OrderItemRepository;
import com.bkb.repository.OrderRepository;
import com.bkb.repository.UserRepository;
import com.bkb.entity.enums.UserRole;
import com.opencsv.CSVWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.StringWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional(readOnly = true)
@Slf4j
public class ReportService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public SalesReportResponse getDailySalesReport(LocalDate from, LocalDate to) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt = to.plusDays(1).atStartOfDay();

        var orders = orderRepository.findByDateRange(fromDt, toDt);

        BigDecimal totalRevenue = orders.stream()
                .filter(o -> com.bkb.entity.enums.PaymentStatus.PAID.equals(o.getPaymentStatus()))
                .map(o -> o.getTotal() != null ? o.getTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalOrders = orders.stream()
                .filter(o -> com.bkb.entity.enums.PaymentStatus.PAID.equals(o.getPaymentStatus()))
                .count();

        BigDecimal avgOrderValue = totalOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Build daily revenue entries
        List<SalesReportResponse.DailyRevenueEntry> dailyRevenue = new ArrayList<>();
        LocalDate current = from;
        while (!current.isAfter(to)) {
            final LocalDate day = current;
            BigDecimal dayRevenue = orders.stream()
                    .filter(o -> com.bkb.entity.enums.PaymentStatus.PAID.equals(o.getPaymentStatus()))
                    .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().toLocalDate().equals(day))
                    .map(o -> o.getTotal() != null ? o.getTotal() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            long dayOrders = orders.stream()
                    .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().toLocalDate().equals(day))
                    .count();

            dailyRevenue.add(SalesReportResponse.DailyRevenueEntry.builder()
                    .date(day.format(DATE_FMT))
                    .revenue(dayRevenue)
                    .orders(dayOrders)
                    .build());

            current = current.plusDays(1);
        }

        // Top selling items
        List<Object[]> topRaw = orderItemRepository.findTopSellingItems(fromDt, toDt, BigDecimal.ZERO);
        List<SalesReportResponse.TopItemEntry> topItems = topRaw.stream()
                .limit(10)
                .map(row -> SalesReportResponse.TopItemEntry.builder()
                        .itemName((String) row[1])
                        .totalQuantity(((Number) row[2]).longValue())
                        .totalRevenue(row[3] != null ? (row[3] instanceof BigDecimal ? (BigDecimal) row[3] : BigDecimal.valueOf(((Number) row[3]).doubleValue())) : BigDecimal.ZERO)
                        .build())
                .toList();

        return SalesReportResponse.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .avgOrderValue(avgOrderValue)
                .dailyRevenue(dailyRevenue)
                .topItems(topItems)
                .build();
    }

    public String exportToCsv(LocalDate from, LocalDate to) {
        SalesReportResponse report = getDailySalesReport(from, to);
        StringWriter sw = new StringWriter();
        try (CSVWriter writer = new CSVWriter(sw)) {
            writer.writeNext(new String[]{"Date", "Revenue (RM)", "Orders"});
            for (SalesReportResponse.DailyRevenueEntry entry : report.getDailyRevenue()) {
                writer.writeNext(new String[]{
                        entry.getDate(),
                        entry.getRevenue().toString(),
                        String.valueOf(entry.getOrders())
                });
            }
            writer.writeNext(new String[]{"TOTAL", report.getTotalRevenue().toString(),
                    String.valueOf(report.getTotalOrders())});
        } catch (Exception e) {
            log.error("CSV export error", e);
        }
        return sw.toString();
    }

    public ExecutiveDashboardResponse getExecutiveDashboardMetrics(LocalDate from, LocalDate to) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt = to.plusDays(1).atStartOfDay();

        BigDecimal rev = orderRepository.sumRevenueBetween(fromDt, toDt);
        if (rev == null) rev = BigDecimal.ZERO;
        BigDecimal prof = orderRepository.sumProfitBetween(fromDt, toDt, BigDecimal.ZERO);
        if (prof == null) prof = BigDecimal.ZERO;
        long ord = orderRepository.countOrdersBetween(fromDt, toDt);
        long cust = orderRepository.countUniqueCustomersBetween(fromDt, toDt);

        // Calculate previous period for trends
        long days = java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1;
        LocalDateTime prevFromDt = fromDt.minusDays(days);
        LocalDateTime prevToDt = toDt.minusDays(days);

        BigDecimal prevRev = orderRepository.sumRevenueBetween(prevFromDt, prevToDt);
        if (prevRev == null) prevRev = BigDecimal.ZERO;
        BigDecimal prevProf = orderRepository.sumProfitBetween(prevFromDt, prevToDt, BigDecimal.ZERO);
        if (prevProf == null) prevProf = BigDecimal.ZERO;
        long prevOrd = orderRepository.countOrdersBetween(prevFromDt, prevToDt);
        long prevCust = orderRepository.countUniqueCustomersBetween(prevFromDt, prevToDt);

        List<Object[]> topRaw = orderItemRepository.findTopSellingItems(fromDt, toDt, BigDecimal.ZERO);
        List<ExecutiveDashboardResponse.TopItemEntry> topItems = topRaw.stream()
                .limit(6)
                .map(row -> ExecutiveDashboardResponse.TopItemEntry.builder()
                        .itemName((String) row[1])
                        .totalQuantity(((Number) row[2]).longValue())
                        .totalRevenue(row[3] != null ? (row[3] instanceof BigDecimal ? (BigDecimal) row[3] : BigDecimal.valueOf(((Number) row[3]).doubleValue())) : BigDecimal.ZERO)
                        .build())
                .toList();

        return ExecutiveDashboardResponse.builder()
                .revenue(buildMetricCard(rev, prevRev))
                .profit(buildMetricCard(prof, prevProf))
                .orders(buildMetricCard(BigDecimal.valueOf(ord), BigDecimal.valueOf(prevOrd)))
                .customers(buildMetricCard(BigDecimal.valueOf(cust), BigDecimal.valueOf(prevCust)))
                .peakHours(getPeakBusinessHours(from, to))
                .topItems(topItems)
                .build();
    }

    public List<ExecutiveDashboardResponse.PeakHour> getPeakBusinessHours(LocalDate from, LocalDate to) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt = to.plusDays(1).atStartOfDay();
        
        List<Object[]> raw = orderRepository.getPeakHours(fromDt, toDt);
        List<ExecutiveDashboardResponse.PeakHour> peakHours = new ArrayList<>();
        
        for (Object[] row : raw) {
            Number hr = (Number) row[0];
            Number cnt = (Number) row[1];
            
            // Format hour (e.g. 14 -> "2:00 PM")
            int hourInt = hr.intValue();
            String ampm = hourInt >= 12 ? "PM" : "AM";
            int displayHour = hourInt % 12;
            if (displayHour == 0) displayHour = 12;
            String formattedHour = displayHour + ":00 " + ampm;

            peakHours.add(ExecutiveDashboardResponse.PeakHour.builder()
                    .hour(formattedHour)
                    .orderCount(cnt.longValue())
                    .build());
        }
        return peakHours;
    }

    public MenuAnalyticsResponse getAdvancedMenuPerformance(LocalDate from, LocalDate to) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt = to.plusDays(1).atStartOfDay();

        List<Object[]> topRaw = orderItemRepository.findTopSellingItems(fromDt, toDt, BigDecimal.ZERO);
        List<Object[]> worstRaw = orderItemRepository.findWorstSellingItems(fromDt, toDt, BigDecimal.ZERO);

        return MenuAnalyticsResponse.builder()
                .topSellers(mapMenuPerformance(topRaw))
                .worstSellers(mapMenuPerformance(worstRaw))
                .build();
    }

    private List<MenuAnalyticsResponse.MenuItemPerformance> mapMenuPerformance(List<Object[]> raw) {
        return raw.stream()
                .limit(10)
                .map(row -> MenuAnalyticsResponse.MenuItemPerformance.builder()
                        .itemName((String) row[1])
                        .totalSold(((Number) row[2]).longValue())
                        .totalRevenue(row[3] != null ? (row[3] instanceof BigDecimal ? (BigDecimal) row[3] : BigDecimal.valueOf(((Number) row[3]).doubleValue())) : BigDecimal.ZERO)
                        .estimatedProfit(row[4] != null ? (row[4] instanceof BigDecimal ? (BigDecimal) row[4] : BigDecimal.valueOf(((Number) row[4]).doubleValue())) : BigDecimal.ZERO)
                        .build())
                .collect(Collectors.toList());
    }

    private ExecutiveDashboardResponse.MetricCard buildMetricCard(BigDecimal current, BigDecimal previous) {
        BigDecimal percentChange = BigDecimal.ZERO;
        if (previous.compareTo(BigDecimal.ZERO) > 0) {
            percentChange = current.subtract(previous)
                    .divide(previous, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        } else if (current.compareTo(BigDecimal.ZERO) > 0) {
            percentChange = BigDecimal.valueOf(100);
        }

        return ExecutiveDashboardResponse.MetricCard.builder()
                .value(current.toString())
                .percentChange(percentChange)
                .isPositive(percentChange.compareTo(BigDecimal.ZERO) >= 0)
                .build();
    }

    public long countActiveStaff() {
        return userRepository.findByRoleIn(
                Arrays.asList(UserRole.STAFF, UserRole.MANAGER)).stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive())).count();
    }

    public CustomerInsightsResponse getCustomerInsights() {
        LocalDateTime beginningOfTime = LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime now = LocalDateTime.now();

        long totalUniqueCustomers = orderRepository.countUniqueCustomersBetween(beginningOfTime, now);
        long repeatCustomers = orderRepository.countRepeatCustomers();
        BigDecimal totalRevenueFromUsers = orderRepository.sumUserRevenue();
        if (totalRevenueFromUsers == null) totalRevenueFromUsers = BigDecimal.ZERO;
        
        BigDecimal avgLtv = BigDecimal.ZERO;
        if (totalUniqueCustomers > 0) {
            avgLtv = totalRevenueFromUsers.divide(BigDecimal.valueOf(totalUniqueCustomers), 2, RoundingMode.HALF_UP);
        }

        Double avgRatingDouble = orderRepository.getAverageRating();
        BigDecimal avgRating = avgRatingDouble != null ? BigDecimal.valueOf(avgRatingDouble) : BigDecimal.ZERO;

        List<com.bkb.entity.Order> recentOrders = orderRepository.findRecentFeedback();
        List<CustomerInsightsResponse.FeedbackEntry> feedbackList = new ArrayList<>();
        for (com.bkb.entity.Order o : recentOrders) {
            feedbackList.add(CustomerInsightsResponse.FeedbackEntry.builder()
                    .customerName(o.getUser() != null ? o.getUser().getName() : (o.getGuestName() != null ? o.getGuestName() : "Guest"))
                    .orderNumber(o.getOrderNumber())
                    .rating(o.getRating())
                    .feedback(o.getFeedback())
                    .date(o.getCreatedAt() != null ? o.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM dd, yyyy")) : "")
                    .build());
        }

        return CustomerInsightsResponse.builder()
                .totalUniqueCustomers(totalUniqueCustomers)
                .repeatCustomers(repeatCustomers)
                .averageCustomerLtv(avgLtv)
                .averageRating(avgRating.setScale(1, RoundingMode.HALF_UP))
                .recentFeedback(feedbackList)
                .build();
    }

    public List<StaffPerformanceEntry> getStaffPerformance(LocalDate from, LocalDate to) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt = to.plusDays(1).atStartOfDay();

        List<Object[]> raw = orderRepository.getStaffPerformance(fromDt, toDt);
        List<StaffPerformanceEntry> result = new ArrayList<>();

        for (Object[] row : raw) {
            String name = (String) row[0];
            Number cnt = (Number) row[1];
            result.add(new StaffPerformanceEntry(name, cnt.longValue()));
        }

        return result;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class StaffPerformanceEntry {
        private String staffName;
        private Long ordersCompleted;
    }
}
