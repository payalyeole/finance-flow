package com.finance.backend.config;

import com.finance.backend.entity.Transaction;
import com.finance.backend.entity.User;
import com.finance.backend.enums.Role;
import com.finance.backend.enums.TransactionType;
import com.finance.backend.repository.TransactionRepository;
import com.finance.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) return;

        log.info("Seeding initial data...");

        // --- Users ---
        User admin = userRepository.save(User.builder()
                .username("admin")
                .password(passwordEncoder.encode("admin123"))
                .email("admin@finance.com")
                .fullName("System Administrator")
                .role(Role.ADMIN)
                .active(true)
                .build());

        User analyst = userRepository.save(User.builder()
                .username("analyst")
                .password(passwordEncoder.encode("analyst123"))
                .email("analyst@finance.com")
                .fullName("Finance Analyst")
                .role(Role.ANALYST)
                .active(true)
                .build());

        userRepository.save(User.builder()
                .username("viewer")
                .password(passwordEncoder.encode("viewer123"))
                .email("viewer@finance.com")
                .fullName("Dashboard Viewer")
                .role(Role.VIEWER)
                .active(true)
                .build());

        // --- Sample Transactions (last 6 months) ---
        LocalDate today = LocalDate.now();

        List<Transaction> transactions = List.of(
            // Month 0 (current)
            tx(5000, TransactionType.INCOME,  "Salary",       today.minusDays(2),  "Monthly salary",         admin),
            tx(1200, TransactionType.EXPENSE, "Rent",         today.minusDays(1),  "Monthly rent",           admin),
            tx(300,  TransactionType.EXPENSE, "Groceries",    today.minusDays(3),  "Weekly groceries",       analyst),
            tx(150,  TransactionType.EXPENSE, "Utilities",    today.minusDays(4),  "Electricity bill",       admin),
            tx(800,  TransactionType.INCOME,  "Freelance",    today.minusDays(5),  "Client project",         analyst),

            // Month -1
            tx(5000, TransactionType.INCOME,  "Salary",       today.minusMonths(1).minusDays(2),  "Monthly salary",    admin),
            tx(1200, TransactionType.EXPENSE, "Rent",         today.minusMonths(1).minusDays(1),  "Monthly rent",      admin),
            tx(450,  TransactionType.EXPENSE, "Dining",       today.minusMonths(1).minusDays(5),  "Restaurant bills",  analyst),
            tx(200,  TransactionType.EXPENSE, "Transport",    today.minusMonths(1).minusDays(7),  "Fuel & parking",    analyst),
            tx(1500, TransactionType.INCOME,  "Bonus",        today.minusMonths(1).minusDays(10), "Performance bonus", admin),

            // Month -2
            tx(5000, TransactionType.INCOME,  "Salary",       today.minusMonths(2).minusDays(2),  "Monthly salary",    admin),
            tx(1200, TransactionType.EXPENSE, "Rent",         today.minusMonths(2).minusDays(1),  "Monthly rent",      admin),
            tx(600,  TransactionType.EXPENSE, "Shopping",     today.minusMonths(2).minusDays(8),  "Clothing",          analyst),
            tx(250,  TransactionType.EXPENSE, "Utilities",    today.minusMonths(2).minusDays(4),  "Water & internet",  admin),
            tx(400,  TransactionType.INCOME,  "Freelance",    today.minusMonths(2).minusDays(15), "Side project",      analyst),

            // Month -3
            tx(5000, TransactionType.INCOME,  "Salary",       today.minusMonths(3).minusDays(2),  "Monthly salary",    admin),
            tx(1200, TransactionType.EXPENSE, "Rent",         today.minusMonths(3).minusDays(1),  "Monthly rent",      admin),
            tx(900,  TransactionType.EXPENSE, "Healthcare",   today.minusMonths(3).minusDays(6),  "Medical checkup",   admin),
            tx(180,  TransactionType.EXPENSE, "Groceries",    today.minusMonths(3).minusDays(9),  "Monthly groceries", analyst),
            tx(2000, TransactionType.INCOME,  "Investment",   today.minusMonths(3).minusDays(20), "Dividend payout",   admin),

            // Month -4
            tx(5000, TransactionType.INCOME,  "Salary",       today.minusMonths(4).minusDays(2),  "Monthly salary",    admin),
            tx(1200, TransactionType.EXPENSE, "Rent",         today.minusMonths(4).minusDays(1),  "Monthly rent",      admin),
            tx(750,  TransactionType.EXPENSE, "Travel",       today.minusMonths(4).minusDays(12), "Weekend trip",      analyst),
            tx(300,  TransactionType.EXPENSE, "Dining",       today.minusMonths(4).minusDays(14), "Team dinner",       analyst),
            tx(600,  TransactionType.INCOME,  "Freelance",    today.minusMonths(4).minusDays(18), "Design work",       analyst),

            // Month -5
            tx(5000, TransactionType.INCOME,  "Salary",       today.minusMonths(5).minusDays(2),  "Monthly salary",    admin),
            tx(1200, TransactionType.EXPENSE, "Rent",         today.minusMonths(5).minusDays(1),  "Monthly rent",      admin),
            tx(1100, TransactionType.EXPENSE, "Shopping",     today.minusMonths(5).minusDays(5),  "Electronics",       admin),
            tx(200,  TransactionType.EXPENSE, "Transport",    today.minusMonths(5).minusDays(10), "Monthly commute",   analyst),
            tx(350,  TransactionType.INCOME,  "Freelance",    today.minusMonths(5).minusDays(22), "Consulting",        analyst)
        );

        transactionRepository.saveAll(transactions);
        log.info("Seeding complete. {} users, {} transactions created.", 3, transactions.size());
        log.info("=== Default Credentials ===");
        log.info("ADMIN    -> username: admin    | password: admin123");
        log.info("ANALYST  -> username: analyst  | password: analyst123");
        log.info("VIEWER   -> username: viewer   | password: viewer123");
        log.info("Swagger UI: http://localhost:8080/swagger-ui.html");
        log.info("H2 Console: http://localhost:8080/h2-console");
    }

    private Transaction tx(double amount, TransactionType type, String category,
                           LocalDate date, String notes, User user) {
        return Transaction.builder()
                .amount(BigDecimal.valueOf(amount))
                .type(type)
                .category(category)
                .date(date)
                .notes(notes)
                .createdBy(user)
                .deleted(false)
                .build();
    }
}
