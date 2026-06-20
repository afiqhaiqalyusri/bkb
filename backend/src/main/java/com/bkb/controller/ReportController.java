package com.bkb.controller;

import com.bkb.dto.response.ApiResponse;
import com.bkb.dto.response.CustomerInsightsResponse;
import com.bkb.dto.response.ExecutiveDashboardResponse;
import com.bkb.dto.response.MenuAnalyticsResponse;
import com.bkb.dto.response.SalesReportResponse;
import com.bkb.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/sales/daily")
    public ResponseEntity<ApiResponse<SalesReportResponse>> dailySales(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getDailySalesReport(from, to)));
    }

    @GetMapping("/executive")
    public ResponseEntity<ApiResponse<ExecutiveDashboardResponse>> getExecutiveDashboard(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getExecutiveDashboardMetrics(from, to)));
    }

    @GetMapping("/menu-analytics")
    public ResponseEntity<ApiResponse<MenuAnalyticsResponse>> getMenuAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate fromDate = (from == null) ? LocalDate.now().minusDays(30) : from;
        LocalDate toDate = (to == null) ? LocalDate.now() : to;
        return ResponseEntity.ok(ApiResponse.success(reportService.getAdvancedMenuPerformance(fromDate, toDate)));
    }

    @GetMapping("/customer-insights")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<CustomerInsightsResponse>> getCustomerInsights() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getCustomerInsights()));
    }

    @GetMapping("/sales/monthly")
    public ResponseEntity<ApiResponse<SalesReportResponse>> monthlySales(
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().withDayOfMonth(1).toString()}") String from,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().toString()}") String to) {
        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);
        return ResponseEntity.ok(ApiResponse.success(reportService.getDailySalesReport(fromDate, toDate)));
    }

    @GetMapping("/items/top-selling")
    public ResponseEntity<ApiResponse<SalesReportResponse>> topSelling(
            @RequestParam(defaultValue = "30") int days) {
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(days);
        return ResponseEntity.ok(ApiResponse.success(reportService.getDailySalesReport(from, to)));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportReport(
            @RequestParam(defaultValue = "csv") String type,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        String csv = reportService.exportToCsv(from, to);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=bkb-report-" + from + "-to-" + to + ".csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv.getBytes());
    }

    @GetMapping("/staff-performance")
    public ResponseEntity<ApiResponse<java.util.List<ReportService.StaffPerformanceEntry>>> getStaffPerformance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate fromDate = (from == null) ? LocalDate.now().minusDays(30) : from;
        LocalDate toDate = (to == null) ? LocalDate.now() : to;
        return ResponseEntity.ok(ApiResponse.success(reportService.getStaffPerformance(fromDate, toDate)));
    }
}
