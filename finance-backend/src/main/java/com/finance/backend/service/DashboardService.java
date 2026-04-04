package com.finance.backend.service;

import com.finance.backend.dto.response.DashboardSummaryResponse;

public interface DashboardService {
    DashboardSummaryResponse getSummary(int recentLimit, int trendMonths);
}
