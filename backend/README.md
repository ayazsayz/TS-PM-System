# Tspm Backend — .NET 10 + SQL Server API

REST API for the Timesheet & Project-Management SaaS. Built with **.NET 10**, **EF Core 10**,
**SQL Server**, and **JWT + ASP.NET Identity** auth, in a **Clean Architecture** solution. It
serves the React frontend in [`../app`](../app) and is seeded with the same demo data the UI shows.

> **Living document** — updated with every meaningful change. See the [Changelog](#changelog).

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Runtime | .NET 10 (LTS) |
| Web | ASP.NET Core Web API (controllers) |
| Data | EF Core 10 + SQL Server (code-first migrations) |
| Auth | JWT access + refresh tokens on ASP.NET Core Identity |
| Validation | FluentValidation |
| Docs | Swagger / OpenAPI (Swashbuckle) with a JWT auth button |
| Logging | Serilog |

## Solution layout

```
backend/
├─ Tspm.slnx                    # .NET 10 XML solution
├─ src/
│  ├─ Tspm.Domain/             # entities + enums (no dependencies)
│  ├─ Tspm.Application/        # services, DTOs, interfaces, validation
│  ├─ Tspm.Infrastructure/     # EF Core, Identity, JWT, migrations, seed
│  └─ Tspm.Api/                # controllers, DI, middleware, Program.cs
└─ tests/
   └─ Tspm.Tests/              # xUnit (service + integration tests)
```

Dependency flow: `Api → Application → Domain`; `Infrastructure → Application/Domain`;
`Api` composes both at startup.

---

## Getting started

### Prerequisites
- .NET 10 SDK
- A reachable SQL Server instance (LocalDB, Docker, or a full server)

### 1. Configure the connection string + signing key

The connection string is read from configuration. For local dev it currently lives in
`src/Tspm.Api/appsettings.Development.json`. For anything shared/production, prefer
**user-secrets** so nothing sensitive is committed:

```bash
cd src/Tspm.Api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=YOUR-SERVER;Database=TSPMDB;Trusted_Connection=True;TrustServerCertificate=True;"
dotnet user-secrets set "Jwt:SigningKey" "<a long random secret, 32+ chars>"
```

> If `Jwt:SigningKey` is left empty, a clearly-labelled **insecure dev fallback** key is used so
> the app runs locally out of the box. **Always set a real key outside local dev.**

### 2. Run

```bash
cd src/Tspm.Api
dotnet run
```

On startup the app **applies migrations and seeds** the demo data automatically (guarded — it
skips if no connection string is configured). Swagger UI is served at the root in Development.

### Demo credentials
All seeded users share the password **`Passw0rd!`** (configurable via `Seed:DemoPassword`).

| User | Email | Roles |
| --- | --- | --- |
| Alex Morgan | `alex.morgan@etech.io` | Employee, Manager |
| Sarah Chen, Marcus Webb, Priya Sharma, … | `first.last@etech.io` | Employee |
| Dana Whitfield | `dana.whitfield@etech.io` | Manager |

---

## Database & migrations

Code-first EF Core. The context is `AppDbContext` (an `IdentityDbContext`).

```bash
# from backend/
dotnet ef migrations add <Name> --project src/Tspm.Infrastructure --startup-project src/Tspm.Infrastructure --output-dir Persistence/Migrations
dotnet ef database update       --project src/Tspm.Infrastructure --startup-project src/Tspm.Infrastructure
```

A `DesignTimeDbContextFactory` lets the EF CLI build the model without a live DB. `DbInitializer`
applies migrations + seeds on startup (idempotent).

**Rollup note:** project `ActualHours`/`Spent` are stored rollups seeded to demo values (a real
system recomputes them from `TimeEntry` history). Current-week totals *are* derived live from entries.

---

## Authentication

1. `POST /api/auth/login` → `{ accessToken, refreshToken, accessTokenExpiresAt, user }`
2. Send `Authorization: Bearer <accessToken>` on protected calls.
3. `POST /api/auth/refresh` rotates the pair; refresh tokens are stored **hashed** on the user.
4. Role policies: `ManagerOnly` (Manager/Admin), `AdminOnly`.

---

## API surface

### Implemented ✅

**Auth**
- `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`

**Projects**
- `GET /api/projects` (`?filter=all|running|at-risk|completed`)
- `GET /api/projects/mine`, `GET /api/projects/{id}`

**Tasks**
- `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/{id}/toggle`, `PUT /api/tasks/{id}`, `DELETE /api/tasks/{id}`

**Time entries**
- `GET /api/time-entries?date=YYYY-MM-DD` or `?weekStart=YYYY-MM-DD`
- `POST /api/time-entries`, `PUT /api/time-entries/{id}`, `DELETE /api/time-entries/{id}`
- `POST /api/time-entries/duplicate`

**Timesheets (weekly)**
- `GET /api/timesheets?weekStart=YYYY-MM-DD` (weekly grid derived from entries)
- `POST /api/timesheets/submit?weekStart=YYYY-MM-DD`

### Planned 🚧
- **Approvals** (list / approve / reject / bulk / audit trail)
- **Team Overview** (utilization, missing timesheets, top performers)
- **Dashboards** (employee + manager KPI aggregates)
- **Reports** (revenue KPIs, 12-week trend, billable split, est-vs-actual, client billing)
- **Notifications** (list, mark-all-read)

---

## Configuration keys

| Key | Purpose |
| --- | --- |
| `ConnectionStrings:DefaultConnection` | SQL Server connection string |
| `Jwt:Issuer` / `Audience` / `AccessTokenMinutes` / `RefreshTokenDays` | Token settings |
| `Jwt:SigningKey` | HMAC signing key (set outside local dev) |
| `Cors:AllowedOrigins` | Allowed frontend origins (defaults to Vite dev ports) |
| `Seed:Enabled` / `Seed:DemoPassword` | Seeding toggle + demo password |

## Build & test

```bash
dotnet build Tspm.slnx
dotnet test  Tspm.slnx
```

---

## Changelog

Newest first.

### 2026-07-12 — Initial backend (B0–B5)
- Scaffolded the 4-project Clean Architecture solution (.NET 10) + xUnit test project.
- Domain entities + enums; EF Core `AppDbContext` (Identity) with full Fluent config.
- Initial migration + a complete `DbInitializer` seed porting the frontend demo data
  (9 users, 5 clients, 7 projects + teams, a full week of Alex's entries, tasks,
  approval timesheets, audit trail, notifications).
- JWT + refresh-token auth on ASP.NET Identity; role policies; `AuthController`; Swagger JWT button.
- Application services + DTOs + FluentValidation for Projects, Tasks, Time entries, Timesheets;
  `IAppDbContext` / `IUserDirectory` abstractions; validation filter.
- Controllers for the core resources — all verified live against SQL Server.
- **Planned next:** approvals, team overview, dashboards, reports, notifications (B6–B8).
