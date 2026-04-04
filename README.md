# Finance Data Processing and Access Control Backend

A Spring Boot REST API for a finance dashboard system with role-based access control, financial record management, and analytics.

---

## Tech Stack

| Layer        | Technology                          |
|-------------|-------------------------------------|
| Language     | Java 17                             |
| Framework    | Spring Boot 3.2.4                   |
| Security     | Spring Security + JWT (jjwt 0.12.5) |
| Database     | H2 (in-memory, auto-seeded)         |
| ORM          | Spring Data JPA / Hibernate         |
| Validation   | Jakarta Bean Validation             |
| Docs         | SpringDoc OpenAPI (Swagger UI)      |
| Tests        | JUnit 5 + Spring MockMvc            |
| Build        | Maven                               |

---

## Getting Started

### Prerequisites
- Java 17+
- Maven 3.8+

### Run

```bash
git clone <repo-url>
cd finance-backend
mvn spring-boot:run
```

The application starts on **http://localhost:8080**.

On first boot, the `DataSeeder` automatically creates 3 users and 30 sample transactions.

---

## Default Credentials

| Role    | Username | Password   |
|---------|----------|------------|
| ADMIN   | admin    | admin123   |
| ANALYST | analyst  | analyst123 |
| VIEWER  | viewer   | viewer123  |

---

## API Documentation

- **Swagger UI:** http://localhost:8080/swagger-ui.html
- **OpenAPI JSON:** http://localhost:8080/api-docs
- **H2 Console:** http://localhost:8080/h2-console *(JDBC URL: `jdbc:h2:mem:financedb`)*

### How to authenticate in Swagger:
1. `POST /api/auth/login` with your credentials
2. Copy the `token` from the response
3. Click **Authorize** (top right) → paste `Bearer <token>`

---

## API Reference

### Authentication
| Method | Endpoint         | Auth Required | Description        |
|--------|-----------------|---------------|--------------------|
| POST   | /api/auth/login | No            | Login, get JWT     |

### Users *(ADMIN only)*
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | /api/users                  | Create user              |
| GET    | /api/users                  | List all users           |
| GET    | /api/users/{id}             | Get user by ID           |
| PUT    | /api/users/{id}             | Update user              |
| PATCH  | /api/users/{id}/toggle-status | Toggle active/inactive |
| DELETE | /api/users/{id}             | Delete user              |

### Transactions
| Method | Endpoint               | Roles Allowed            | Description            |
|--------|------------------------|--------------------------|------------------------|
| POST   | /api/transactions      | ANALYST, ADMIN           | Create transaction     |
| GET    | /api/transactions      | VIEWER, ANALYST, ADMIN   | List (filtered, paged) |
| GET    | /api/transactions/{id} | VIEWER, ANALYST, ADMIN   | Get by ID              |
| PUT    | /api/transactions/{id} | ANALYST, ADMIN           | Update transaction     |
| DELETE | /api/transactions/{id} | ADMIN                    | Soft delete            |

**Query Parameters for GET /api/transactions:**
- `type` — `INCOME` or `EXPENSE`
- `category` — filter by category name (case-insensitive)
- `from` / `to` — date range as `YYYY-MM-DD`
- `page`, `size` — pagination (default: page=0, size=20)
- `sortBy`, `sortDir` — sorting (default: date desc)

### Dashboard *(all authenticated roles)*
| Method | Endpoint                | Description                              |
|--------|-------------------------|------------------------------------------|
| GET    | /api/dashboard/summary  | Full summary: totals, categories, trends |

**Query Parameters:**
- `recentLimit` — number of recent transactions to return (1–50, default 10)
- `trendMonths` — how many months back for trends (1–24, default 6)

---

## Role Permissions Matrix

| Action                    | VIEWER | ANALYST | ADMIN |
|---------------------------|:------:|:-------:|:-----:|
| Login                     | ✅     | ✅      | ✅    |
| View transactions         | ✅     | ✅      | ✅    |
| View dashboard summary    | ✅     | ✅      | ✅    |
| Create transactions       | ❌     | ✅      | ✅    |
| Update transactions       | ❌     | ✅      | ✅    |
| Delete transactions       | ❌     | ❌      | ✅    |
| Manage users              | ❌     | ❌      | ✅    |

---

## Project Structure

```
src/
├── main/java/com/finance/backend/
│   ├── config/
│   │   ├── DataSeeder.java          # Seeds initial users + transactions on startup
│   │   ├── OpenApiConfig.java       # Swagger/OpenAPI configuration
│   │   └── SecurityConfig.java      # Spring Security + JWT filter chain
│   ├── controller/
│   │   ├── AuthController.java      # POST /api/auth/login
│   │   ├── DashboardController.java # GET /api/dashboard/summary
│   │   ├── TransactionController.java
│   │   └── UserController.java
│   ├── dto/
│   │   ├── request/                 # Input DTOs with validation annotations
│   │   └── response/                # Output DTOs (ApiResponse wrapper, etc.)
│   ├── entity/
│   │   ├── User.java                # Implements UserDetails (Spring Security)
│   │   └── Transaction.java         # Soft-delete via `deleted` flag
│   ├── enums/
│   │   ├── Role.java                # VIEWER, ANALYST, ADMIN
│   │   └── TransactionType.java     # INCOME, EXPENSE
│   ├── exception/
│   │   ├── GlobalExceptionHandler.java  # @RestControllerAdvice
│   │   ├── ResourceNotFoundException.java
│   │   └── ConflictException.java
│   ├── repository/
│   │   ├── UserRepository.java
│   │   └── TransactionRepository.java   # Custom JPQL queries for filters & aggregations
│   ├── security/
│   │   ├── JwtUtils.java            # Token generation & validation
│   │   └── JwtAuthenticationFilter.java
│   └── service/
│       ├── AuthService.java / impl/
│       ├── UserService.java / impl/
│       ├── TransactionService.java / impl/
│       └── DashboardService.java / impl/
└── test/
    └── FinanceBackendIntegrationTest.java
```

---

## Key Design Decisions

### 1. Soft Delete
Transactions are never hard-deleted. The `deleted` boolean flag is set to `true` on DELETE, and all queries filter `WHERE deleted = false`. This preserves audit history and allows recovery.

### 2. Unified API Response Envelope
All endpoints return `ApiResponse<T>` with `success`, `message`, `data`, and `timestamp` fields. This gives the frontend a consistent structure to handle.

### 3. Role Enforcement at Two Levels
- **URL-level:** `SecurityConfig` restricts HTTP methods per role (e.g., `DELETE /api/transactions/**` → ADMIN only)
- **Method-level:** `@PreAuthorize("hasRole('ADMIN')")` on controller classes as a second guard

### 4. Dashboard Service Aggregation
The dashboard query pre-fills all months in the requested range (even empty ones) before merging DB results, so the frontend always receives a complete trend chart without gaps.

### 5. Stateless JWT Authentication
No server-side session state. Every request carries a JWT in the `Authorization: Bearer <token>` header. Tokens expire after 24 hours (configurable in `application.properties`).

### 6. In-Memory H2 Database
For simplicity and zero-setup portability. Swap to PostgreSQL by changing the datasource properties — no code changes required.

---

## Running Tests

```bash
mvn test
```

The integration test suite covers:
- Login with valid/invalid credentials
- Role-based access control (viewer blocked from create/delete; analyst blocked from delete; admin has full access)
- Dashboard accessible to all roles
- Input validation returning 400 with field errors
- Unauthenticated requests rejected

---

## Assumptions

1. A **Viewer** cannot create, update, or delete any record — read-only access throughout.
2. An **Analyst** can create and update transactions but cannot delete them or manage users.
3. **Soft delete** is used for transactions (deleted flag); users are hard-deleted since they have no financial audit requirement in this scope.
4. The JWT secret is stored in `application.properties` for simplicity. In production this should come from an environment variable or secrets manager.
5. Password hashing uses **BCrypt** (cost factor 10 default).
6. Category is stored as a free-text string (not a separate entity) to keep the schema simple; it is trimmed and used in case-insensitive filtering.
