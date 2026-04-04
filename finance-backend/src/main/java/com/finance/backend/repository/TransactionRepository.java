package com.finance.backend.repository;

import com.finance.backend.entity.Transaction;
import com.finance.backend.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // Find non-deleted by ID
    Optional<Transaction> findByIdAndDeletedFalse(Long id);

    // Paginated listing with filters
    @Query("""
        SELECT t FROM Transaction t
        WHERE t.deleted = false
          AND (:type IS NULL OR t.type = :type)
          AND (:category IS NULL OR LOWER(t.category) = LOWER(:category))
          AND (:from IS NULL OR t.date >= :from)
          AND (:to IS NULL OR t.date <= :to)
        ORDER BY t.date DESC
    """)
    Page<Transaction> findAllWithFilters(
            @Param("type") TransactionType type,
            @Param("category") String category,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable
    );

    // Dashboard summary queries
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.deleted = false AND t.type = :type")
    BigDecimal sumByType(@Param("type") TransactionType type);

    @Query("SELECT t.category, COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.deleted = false AND t.type = :type GROUP BY t.category")
    List<Object[]> sumByCategory(@Param("type") TransactionType type);

    @Query("""
        SELECT FUNCTION('YEAR', t.date), FUNCTION('MONTH', t.date), t.type, COALESCE(SUM(t.amount), 0)
        FROM Transaction t
        WHERE t.deleted = false
          AND t.date >= :from
        GROUP BY FUNCTION('YEAR', t.date), FUNCTION('MONTH', t.date), t.type
        ORDER BY FUNCTION('YEAR', t.date), FUNCTION('MONTH', t.date)
    """)
    List<Object[]> monthlyTrends(@Param("from") LocalDate from);

    // Recent activity
    @Query("SELECT t FROM Transaction t WHERE t.deleted = false ORDER BY t.createdAt DESC")
    List<Transaction> findRecentActivity(Pageable pageable);
}
