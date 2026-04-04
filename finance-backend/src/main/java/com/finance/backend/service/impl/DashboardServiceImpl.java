package com.finance.backend.service.impl;

import com.finance.backend.dto.response.DashboardSummaryResponse;
import com.finance.backend.dto.response.DashboardSummaryResponse.MonthlyTrendEntry;
import com.finance.backend.dto.response.TransactionResponse;
import com.finance.backend.enums.TransactionType;
import com.finance.backend.repository.TransactionRepository;
import com.finance.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final TransactionRepository transactionRepository;
    private final TransactionServiceImpl transactionService;

    @Override
    public DashboardSummaryResponse getSummary(int recentLimit, int trendMonths) {
        BigDecimal totalIncome = transactionRepository.sumByType(TransactionType.INCOME);
        BigDecimal totalExpenses = transactionRepository.sumByType(TransactionType.EXPENSE);
        BigDecimal netBalance = totalIncome.subtract(totalExpenses);

        Map<String, BigDecimal> incomeByCategory = buildCategoryMap(TransactionType.INCOME);
        Map<String, BigDecimal> expensesByCategory = buildCategoryMap(TransactionType.EXPENSE);

        List<MonthlyTrendEntry> trends = buildMonthlyTrends(trendMonths);

        List<TransactionResponse> recent = transactionRepository
                .findRecentActivity(PageRequest.of(0, recentLimit))
                .stream()
                .map(transactionService::toResponse)
                .toList();

        return DashboardSummaryResponse.builder()
                .totalIncome(totalIncome)
                .totalExpenses(totalExpenses)
                .netBalance(netBalance)
                .incomeByCategory(incomeByCategory)
                .expensesByCategory(expensesByCategory)
                .monthlyTrends(trends)
                .recentActivity(recent)
                .build();
    }

    private Map<String, BigDecimal> buildCategoryMap(TransactionType type) {
        Map<String, BigDecimal> map = new LinkedHashMap<>();
        transactionRepository.sumByCategory(type).forEach(row -> {
            String category = (String) row[0];
            BigDecimal total = (BigDecimal) row[1];
            map.put(category, total);
        });
        return map;
    }

    private List<MonthlyTrendEntry> buildMonthlyTrends(int months) {
        LocalDate from = LocalDate.now().withDayOfMonth(1).minusMonths(months - 1L);
        List<Object[]> rows = transactionRepository.monthlyTrends(from);

        // Group by year+month
        Map<String, MonthlyTrendEntry> trendMap = new LinkedHashMap<>();

        // Pre-fill all months in range so empty months still appear
        for (int i = months - 1; i >= 0; i--) {
            LocalDate month = LocalDate.now().minusMonths(i);
            String key = month.getYear() + "-" + String.format("%02d", month.getMonthValue());
            trendMap.put(key, MonthlyTrendEntry.builder()
                    .year(month.getYear())
                    .month(month.getMonthValue())
                    .monthLabel(Month.of(month.getMonthValue()).name().substring(0, 3) + " " + month.getYear())
                    .income(BigDecimal.ZERO)
                    .expenses(BigDecimal.ZERO)
                    .net(BigDecimal.ZERO)
                    .build());
        }

        for (Object[] row : rows) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            TransactionType type = TransactionType.valueOf(row[2].toString());
            BigDecimal amount = (BigDecimal) row[3];

            String key = year + "-" + String.format("%02d", month);
            if (trendMap.containsKey(key)) {
                MonthlyTrendEntry entry = trendMap.get(key);
                if (type == TransactionType.INCOME) {
                    entry.setIncome(amount);
                } else {
                    entry.setExpenses(amount);
                }
                entry.setNet(entry.getIncome().subtract(entry.getExpenses()));
            }
        }

        return new ArrayList<>(trendMap.values());
    }
}
