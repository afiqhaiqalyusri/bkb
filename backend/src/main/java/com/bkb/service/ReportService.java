package com.bkb.service;

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

@Service
@RequiredArgsConstructor
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
        List<Object[]> topRaw = orderItemRepository.findTopSellingItems(fromDt, toDt);
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

    public long countActiveStaff() {
        return userRepository.findByRoleIn(
                Arrays.asList(UserRole.STAFF, UserRole.MANAGER)).stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive())).count();
    }
}
