package com.finance.backend.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {

    private BigDecimal totalIncome;
    private BigDecimal totalExpenses;
    private BigDecimal netBalance;
    private Map<String, BigDecimal> incomeByCategory;
    private Map<String, BigDecimal> expensesByCategory;
    private List<MonthlyTrendEntry> monthlyTrends;
    private List<TransactionResponse> recentActivity;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyTrendEntry {
        private int year;
        private int month;
        private String monthLabel;
        private BigDecimal income;
        private BigDecimal expenses;
        private BigDecimal net;
    }
}
