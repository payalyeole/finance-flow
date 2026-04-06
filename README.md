# FinanceFlow — Full Stack Finance Dashboard

A full-stack finance dashboard system built with **Spring Boot** (backend) and **React** (frontend), featuring role-based access control, financial record management, and analytics.

---

<img width="1919" height="916" alt="image" src="https://github.com/user-attachments/assets/c67eefdf-95a4-4b72-b60f-8f6282fb5303" />

## Tech Stack

| Layer        | Technology                            |
|--------------|---------------------------------------|
| Language     | Java 17                               |
| Framework    | Spring Boot 3.2.4                     |
| Security     | Spring Security + JWT (jjwt 0.12.5)  |
| Database     | H2 (in-memory, auto-seeded)           |
| ORM          | Spring Data JPA / Hibernate           |
| Validation   | Jakarta Bean Validation               |
| Docs         | SpringDoc OpenAPI (Swagger UI)        |
| Tests        | JUnit 5 + Spring MockMvc              |
| Build        | Maven                                 |
| Frontend     | React 18                              |
| Charts       | Recharts                              |
| HTTP Client  | Axios                                 |
| Routing      | React Router v6                       |

---

## Project Structure

```
finance-backend/
├── src/
│   ├── main/java/com/finance/backend/
│   │   ├── config/
│   │   │   ├── DataSeeder.java              # Seeds initial users + transactions on startup
│   │   │   ├── OpenApiConfig.java           # Swagger/OpenAPI configuration
│   │   │   └── SecurityConfig.java          # Spring Security + JWT filter chain
│   │   ├── controller/
│   │   │   ├── AuthController.java          # POST /api/auth/login
│   │   │   ├── DashboardController.java     # GET /api/dashboard/summary
│   │   │   ├── TransactionController.java
│   │   │   └── UserController.java
│   │   ├── dto/
│   │   │   ├── request/                     # Input DTOs with validation annotations
│   │   │   └── response/                    # Output DTOs (ApiResponse wrapper, etc.)
│   │   ├── entity/
│   │   │   ├── User.java                    # Implements UserDetails (Spring Security)
│   │   │   └── Transaction.java             # Soft-delete via deleted flag
│   │   ├── enums/
│   │   │   ├── Role.java                    # VIEWER, ANALYST, ADMIN
│   │   │   └── TransactionType.java         # INCOME, EXPENSE
│   │   ├── exception/
│   │   │   ├── GlobalExceptionHandler.java  # @RestControllerAdvice
│   │   │   ├── ResourceNotFoundException.java
│   │   │   └── ConflictException.java
│   │   ├── repository/
│   │   │   ├── UserRepository.java
│   │   │   └── TransactionRepository.java   # Custom JPQL queries for filters & aggregations
│   │   ├── security/
│   │   │   ├── JwtUtils.java                # Token generation & validation
│   │   │   └── JwtAuthenticationFilter.java
│   │   └── service/
│   │       ├── AuthService.java / impl/
│   │       ├── UserService.java / impl/
│   │       ├── TransactionService.java / impl/
│   │       └── DashboardService.java / impl/
│   └── test/
│       └── FinanceBackendIntegrationTest.java
│
finance-frontend/
├── public/
│   └── index.html
└── src/
    ├── context/
    │   ├── AuthContext.js       # JWT auth state, login/logout
    │   └── ToastContext.js      # Toast notifications
    ├── services/
    │   └── api.js               # Axios client + all API calls
    ├── components/
    │   └── Sidebar.js           # Navigation sidebar
    ├── pages/
    │   ├── Login.js             # Login form with demo credential buttons
    │   ├── Dashboard.js         # Charts & analytics
    │   ├── Transactions.js      # CRUD table with filters & pagination
    │   └── Users.js             # Admin user management
    ├── App.js                   # Router + protected routes
    ├── index.js                 # Entry point
    └── index.css                # Global dark theme styles
```

---

## Getting Started

### Prerequisites

- Java 17+
- Maven 3.8+
- Node.js 18+

---

### 1. Run Backend

```bash
cd finance-backend
mvn spring-boot:run
```

Backend starts on **http://localhost:8080**

On first boot, `DataSeeder` automatically creates 3 users and 30 sample transactions.

---

### 2. Run Frontend

```bash
cd finance-frontend
npm install
npm start
```

Frontend starts on **http://localhost:3000**

---

## Default Credentials

| Role    | Username | Password    | Access                                  |
|---------|----------|-------------|-----------------------------------------|
| ADMIN   | admin    | admin123    | Full access including user management   |
| ANALYST | analyst  | analyst123  | Dashboard + Transactions (create/edit)  |
| VIEWER  | viewer   | viewer123   | Dashboard + Transactions (read only)    |

---

## API Documentation

- **Swagger UI:** http://localhost:8080/swagger-ui.html
- **OpenAPI JSON:** http://localhost:8080/api-docs
- **H2 Console:** http://localhost:8080/h2-console *(JDBC URL: `jdbc:h2:mem:financedb`)*

### How to authenticate in Swagger

1. `POST /api/auth/login` with your credentials
2. Copy the `token` from the response
3. Click **Authorize** (top right) → paste `Bearer <token>`

---

## API Reference

### Authentication

| Method | Endpoint         | Auth Required | Description    |
|--------|-----------------|---------------|----------------|
| POST   | /api/auth/login | No            | Login, get JWT |

### Users *(ADMIN only)*

| Method | Endpoint                       | Description             |
|--------|--------------------------------|-------------------------|
| POST   | /api/users                     | Create user             |
| GET    | /api/users                     | List all users          |
| GET    | /api/users/{id}                | Get user by ID          |
| PUT    | /api/users/{id}                | Update user             |
| PATCH  | /api/users/{id}/toggle-status  | Toggle active/inactive  |
| DELETE | /api/users/{id}                | Delete user             |

### Transactions

| Method | Endpoint               | Roles Allowed           | Description             |
|--------|------------------------|-------------------------|-------------------------|
| POST   | /api/transactions      | ANALYST, ADMIN          | Create transaction      |
| GET    | /api/transactions      | VIEWER, ANALYST, ADMIN  | List (filtered, paged)  |
| GET    | /api/transactions/{id} | VIEWER, ANALYST, ADMIN  | Get by ID               |
| PUT    | /api/transactions/{id} | ANALYST, ADMIN          | Update transaction      |
| DELETE | /api/transactions/{id} | ADMIN                   | Soft delete             |

**Query Parameters for GET /api/transactions:**
- `type` — `INCOME` or `EXPENSE`
- `category` — filter by category name
- `from` / `to` — date range as `YYYY-MM-DD`
- `page`, `size` — pagination (default: page=0, size=20)
- `sortBy`, `sortDir` — sorting (default: date desc)

### Dashboard *(all authenticated roles)*

| Method | Endpoint               | Description                               |
|--------|------------------------|-------------------------------------------|
| GET    | /api/dashboard/summary | Full summary: totals, categories, trends  |

**Query Parameters:**
- `recentLimit` — recent transactions to return (1–50, default 10)
- `trendMonths` — months back for trends (1–24, default 6)

---

## Role Permissions Matrix

| Action                  | VIEWER | ANALYST | ADMIN |
|-------------------------|:------:|:-------:|:-----:|
| Login                   | ✅     | ✅      | ✅    |
| View transactions       | ✅     | ✅      | ✅    |
| View dashboard summary  | ✅     | ✅      | ✅    |
| Create transactions     | ❌     | ✅      | ✅    |
| Update transactions     | ❌     | ✅      | ✅    |
| Delete transactions     | ❌     | ❌      | ✅    |
| Manage users            | ❌     | ❌      | ✅    |

---

## Frontend Features

- **Dashboard** — Area trend chart, pie charts for category breakdown, bar chart for net balance, recent activity table
- **Transactions** — Paginated table with filters (type, category, date range, sort), create/edit modal, delete with confirmation
- **Users** — Full CRUD, toggle active/inactive, role management (Admin only)
- **Auth** — JWT login, protected routes, role-based UI rendering
- **Design** — Dark theme, Syne + JetBrains Mono fonts

---

## CORS Setup (Required for Frontend)

Add this bean to your Spring Boot `SecurityConfig.java`:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:3000"));
    config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}
```

Then add `.cors(cors -> cors.configurationSource(corsConfigurationSource()))` to your `HttpSecurity` chain.

---

## Key Design Decisions

**Soft Delete** — Transactions are never hard-deleted. The `deleted` flag is set to `true` on DELETE and all queries filter it out. This preserves audit history.

**Unified API Response** — All endpoints return `ApiResponse<T>` with `success`, `message`, `data`, and `timestamp` fields for consistent frontend handling.

**Two-Level Role Enforcement** — URL-level via `SecurityConfig` (HTTP method per role) and method-level via `@PreAuthorize` on controllers as a second guard.

**Dashboard Aggregation** — Monthly trend data pre-fills all months in the requested range even if empty, so the frontend always gets a complete chart without gaps.

**Stateless JWT** — No server-side session. Every request carries a JWT in `Authorization: Bearer <token>`. Tokens expire after 24 hours (configurable).

**H2 In-Memory Database** — Zero setup for local development. Swap to PostgreSQL by changing 3 lines in `application.properties` — no code changes needed.

---

## Running Tests

```bash
cd finance-backend
mvn test
```

Integration tests cover:
- Login with valid/invalid credentials
- Role-based access (viewer blocked from create/delete, analyst blocked from delete)
- Dashboard accessible to all roles
- Input validation returning 400 with field errors
- Unauthenticated requests rejected with 401

---

## Assumptions

1. A Viewer cannot create, update, or delete any record — read-only access throughout.
2. An Analyst can create and update transactions but cannot delete or manage users.
3. Soft delete is used for transactions. Users are hard-deleted as they have no financial audit requirement.
4. JWT secret is in `application.properties` for simplicity. In production it should come from an environment variable or secrets manager.
5. Password hashing uses BCrypt (cost factor 10).
6. Category is a free-text string (not a separate entity) to keep the schema simple, trimmed and used in case-insensitive filtering.
