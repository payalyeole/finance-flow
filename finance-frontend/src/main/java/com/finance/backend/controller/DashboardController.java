package com.finance.backend.controller;

import com.finance.backend.dto.response.ApiResponse;
import com.finance.backend.dto.response.DashboardSummaryResponse;
import com.finance.backend.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Summary and analytics endpoints (all authenticated roles)")
@SecurityRequirement(name = "bearerAuth")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    @Operation(summary = "Get full dashboard summary: totals, category breakdown, monthly trends, recent activity")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getSummary(
            @RequestParam(defaultValue = "10") int recentLimit,
            @RequestParam(defaultValue = "6") int trendMonths) {

        if (recentLimit < 1 || recentLimit > 50) {
            throw new IllegalArgumentException("recentLimit must be between 1 and 50");
        }
        if (trendMonths < 1 || trendMonths > 24) {
            throw new IllegalArgumentException("trendMonths must be between 1 and 24");
        }

        return ResponseEntity.ok(ApiResponse.success(dashboardService.getSummary(recentLimit, trendMonths)));
    }
}
