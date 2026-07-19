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

### Getting in — register an organization

The API is **multi-tenant**: every organization owns its own users, clients, projects and time.
A fresh database seeds **only the global roles** — there is no bootstrap admin. You create the
first organization (and its admin) through public signup:

- **`POST /api/auth/register`** with `{ organizationName, fullName, email, password }`, or just
  open the app and click **“Create an organization.”** The registrant becomes that org's Admin.

Seeding is controlled by the `Seed` section of `appsettings.json`:

| Key | Default | Meaning |
| --- | --- | --- |
| `Seed:Enabled` | `true` | Master switch. Migrations still run when `false`. |
| `Seed:DemoData` | **`false`** | Set `true` to seed a **demo organization** ("eTech (Demo)") with the full sample dataset (9 people, 5 clients, 7 projects, timesheets). Demo users share `Seed:DemoPassword`. |

### Resetting to a clean slate

```bash
# drops the database; the next `dotnet run` recreates it and seeds roles only
dotnet ef database drop -f --project src/Tspm.Infrastructure --startup-project src/Tspm.Infrastructure
```
> The design-time factory points at LocalDB, so if your connection string targets another
> server, drop the database there instead (e.g. `DROP DATABASE TSPMDB;`).

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

1. `POST /api/auth/register` creates an organization + its first Admin, or `POST /api/auth/login`
   → `{ accessToken, refreshToken, accessTokenExpiresAt, user }` (the `user` includes its
   `organizationId` + `organizationName`).
2. Send `Authorization: Bearer <accessToken>` on protected calls.
3. `POST /api/auth/refresh` rotates the pair; refresh tokens are stored **hashed** on the user.
4. Role policies: `ManagerOnly` (Manager/Admin), `AdminOnly`.

---

## Multi-tenancy

Every organization is an isolated tenant in a **shared database** (an `OrganizationId` on every
tenant table). One user belongs to exactly one organization; email is globally unique.

Isolation is enforced **centrally in `AppDbContext`**, not per-service, which is what makes it
trustworthy:

- The JWT carries an **`org` claim**; `ICurrentTenant` reads it.
- A **global query filter** scopes every read to the current tenant, and **fails closed**
  (matches nothing) when there is no tenant context.
- `SaveChanges` **auto-stamps** `OrganizationId` on new rows, so a service can never forget.
- `ApplicationUser` is deliberately **not** query-filtered — login must find a user by
  (globally-unique) email before a tenant is known; user-management scopes by org explicitly.

Guards operate per-organization (e.g. the "last admin" protection is the last admin *of that
org*). Existing pre-tenancy data was migrated into a **"Default Organization"** by
`MultiTenant_Organizations`.

---

## API surface

### Implemented ✅

**Auth**
- `POST /api/auth/register` *(public — creates an organization + its first Admin)*
- `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`

**Clients**
- `GET /api/clients` (`?includeArchived=true`) · `GET /api/clients/{id}`
- `POST /api/clients` · `PUT /api/clients/{id}` · `PATCH /api/clients/{id}/archive`
  · `DELETE /api/clients/{id}` *(Manager/Admin)*

**Projects**
- `GET /api/projects` (`?filter=all|running|at-risk|completed`, `?includeArchived=true`)
- `GET /api/projects/mine`, `GET /api/projects/{id}`
- `POST /api/projects` · `PUT /api/projects/{id}` · `PATCH /api/projects/{id}/archive`
  · `DELETE /api/projects/{id}` *(Manager/Admin)* — includes team assignment

**Directory**
- `GET /api/users` — lightweight list for pickers (any signed-in user). The full
  admin list is Admin-only, but Managers need this to assign a project team.

**Tasks**
- `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/{id}/toggle`, `PUT /api/tasks/{id}`, `DELETE /api/tasks/{id}`

**Time entries**
- `GET /api/time-entries?date=YYYY-MM-DD` or `?weekStart=YYYY-MM-DD`
- `POST /api/time-entries`, `PUT /api/time-entries/{id}`, `DELETE /api/time-entries/{id}`
- `POST /api/time-entries/duplicate`

**Timesheets (weekly)**
- `GET /api/timesheets?weekStart=YYYY-MM-DD` (weekly grid derived from entries)
- `POST /api/timesheets/submit?weekStart=YYYY-MM-DD`
- `PUT /api/timesheets/cell?weekStart=YYYY-MM-DD` — upserts one cell of the grid.
  The grid is an **aggregate** (project × task × day), so a cell has no single entry
  id to `PUT`; this creates/updates/clears the underlying entries and returns the
  recomputed week.

**Approvals** *(Manager/Admin)*
- `GET /api/approvals` (`?status=pending`)
- `POST /api/approvals/{id}/approve`, `POST /api/approvals/{id}/reject` (body: `{ comment }`)
- `POST /api/approvals/bulk-approve` (body: `{ ids: [] }`)
- `GET /api/approvals/history` — audit trail

Approving/rejecting updates the timesheet, writes an **audit-log entry**, and raises a
**notification** for the employee.

**Team** *(Manager/Admin)*
- `GET /api/team/utilization`, `GET /api/team/missing`, `GET /api/team/top-performers`

**Dashboards**
- `GET /api/dashboard/employee` — today/week hours, week %, billable %, pending weeks
- `GET /api/dashboard/manager` *(Manager/Admin)* — pending approvals + hours, missing
  timesheets, team utilization, projects at risk

**Reports** *(Manager/Admin)*
- `GET /api/reports/summary` — budget/spend, est-vs-actual per project, client billing,
  billable split, average utilization

**Notifications**
- `GET /api/notifications` (with unread count + relative "ago" labels)
- `POST /api/notifications/mark-all-read`

**User management** *(Admin only)*
- `GET /api/admin/users?search=&role=&status=`
- `GET /api/admin/users/{id}`
- `POST /api/admin/users` → `{ user, oneTimePassword }` — **the password is returned once, never again**
- `PUT /api/admin/users/{id}` (profile) · `PUT /api/admin/users/{id}/roles`
- `PATCH /api/admin/users/{id}/status` (activate / deactivate)
- `POST /api/admin/users/{id}/reset-password` → `{ oneTimePassword }`

**Password change** (any signed-in user)
- `POST /api/auth/change-password` — serves both the *forced* first-login change and a *voluntary* change

**Attendance**
- `GET /api/attendance/today?localDate=YYYY-MM-DD` — open session + today's sessions + total minutes
- `POST /api/attendance/check-in` · `POST /api/attendance/check-out` — body carries the captured position
- `GET /api/attendance/history?from=&to=` — the signed-in user's sessions
- `GET /api/attendance/team?localDate=` *(Manager/Admin)* — who's in today

**Offices** *(Admin only, except the read)*
- `GET /api/offices` · `POST /api/offices` · `PUT /api/offices/{id}` · `DELETE /api/offices/{id}`

### Attendance & location (how it works)
- An **office** is a geofence: a coordinate plus a `RadiusMeters` (default 150).
- On check-in/out the client sends its position; the **server** computes the label by haversine
  distance to each active office — the nearest office within its radius wins. The client
  **cannot assert** that it was in the office, it only reports raw coordinates.
- Position is stored **per event** (in *and* out), with accuracy in metres, so a check-out
  somewhere else is visible rather than overwriting the check-in location.
- `LocationStatus` records *why* a position is missing — `Provided`, `Denied`, `Unavailable` —
  so a denied permission is distinguishable from a failed GPS fix. **Location is never required**;
  a check-in without it still succeeds and is labelled `Unknown`.
- `LocalDate` is supplied by the client so day grouping follows the **user's** calendar day,
  not the server's timezone. Timestamps themselves are UTC.
- A filtered unique index (`UX_AttendanceSessions_OpenPerUser`, `WHERE CheckOutAt IS NULL`)
  makes "at most one open session per user" a **database** guarantee, not just a service check.
- Offices that already have attendance recorded against them **cannot be deleted** — deactivate
  them instead, so history keeps its labels.

### One-time-password flow (how it's enforced)
1. An admin creates a user → the API generates a random OTP and sets `MustChangePassword`.
2. The user logs in with the OTP. The access token carries a **`must_change_password` claim**
   and the response sets `mustChangePassword: true`.
3. `MustChangePasswordFilter` **403s every endpoint** except `change-password`, `me`, and
   `logout` — so the OTP session **cannot be used to skip the change**.
4. On successful change the flag clears and **fresh, unrestricted tokens** are issued.

### Account safety guards
- You cannot deactivate your **own** account or change your **own** roles.
- The **last active administrator** cannot be demoted or deactivated.
- Deactivated users are blocked at login; deactivation is **soft** (timesheets, approvals, and
  audit history are preserved).
- Resetting a password invalidates the user's existing refresh token.

### Notes on derived data
- **Project actual hours and spend are computed, never stored.** Actual hours are summed live
  from `TimeEntry`; spend is `actual hours × Project.HourlyRate`. Log 6h on a $150/h project
  and it immediately reports 6h and $900 against budget.
- **Employee dashboard** uses the user's *most recently logged day* as its reference day, so a
  workspace stays meaningful rather than showing zeros whenever nothing was logged *today*.
- **Team utilization** is derived from each employee's latest timesheet hours ÷ 40.
- **Reports** intentionally omit revenue/margin — those need a bill-rate vs. cost-rate split
  (a future finance module). Budget, spend, hours and utilization are reported.

### Deletion vs. archiving
Records that carry history are archived, not deleted:
- A **client** with projects can't be deleted — archive it.
- A **project** with logged time can't be deleted — archive it.
- **Users** are deactivated (soft), never deleted.

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

### 2026-07-19 — Attendance: check-in/out with location
- **New entities** — `Office` (name, coordinates, radius, active flag) and `AttendanceSession`
  (per-event position, accuracy, `LocationStatus`, matched office and `Place` label). Both are
  tenant-scoped through `IHasOrganization`, so isolation is inherited, not re-implemented.
- **Server-side location resolution** (`AttendanceService.ResolveLocationAsync`) — the `Place`
  label is derived from raw coordinates via haversine (`GeoDistance.MetersBetween`); the client
  never gets to claim it was in the office.
- **One open session per user** enforced by a filtered unique index, so a double check-in fails
  at the database even if two requests race.
- **Office FKs use `NoAction`** — SQL Server rejects two cascade paths from `Offices` to
  `AttendanceSessions`, and deletes are blocked by the service anyway.
- Endpoints: `attendance/today|check-in|check-out|history|team` and `offices` CRUD.

### 2026-07-18 — Multi-tenancy: organizations
- The API is now multi-tenant. New `Organization` entity; `OrganizationId` on every tenant
  table (+ `ApplicationUser`) via `IHasOrganization`.
- Isolation enforced centrally in `AppDbContext`: a global query filter scopes every read
  (fail-closed), and `SaveChanges` auto-stamps new rows. `ApplicationUser` is intentionally
  unfiltered so login can resolve a user before a tenant is known.
- `ICurrentTenant` reads an `org` claim added to the JWT.
- Public `POST /api/auth/register` creates an organization + its first Admin. User management,
  the directory, and the last-admin guard are all scoped per-organization.
- `MultiTenant_Organizations` migration creates a "Default Organization" and backfills all
  existing data into it — nothing lost.
- No more bootstrap admin; the demo dataset now seeds its own demo organization.
- 4 tenant-isolation tests (17 total).

### 2026-07-14 — Live data: client/project CRUD, computed spend, clean-slate seeding
- **Clients CRUD** and **Projects CRUD** (+ team assignment). Previously projects were
  read-only and there was no clients endpoint at all — so there was no way to create the
  data the app runs on.
- **Project actual hours and spend are now computed from logged time**, not stored demo
  values. Added `Project.HourlyRate`; spend = logged hours × rate. Reports aggregate the same way.
  *(The migration explicitly drops `Spent`/`ActualHours` rather than letting EF rename `Spent`
  → `HourlyRate`, which would have turned a $122,000 spend into a $122,000/hour rate.)*
- `PUT /api/timesheets/cell` — upserts a cell of the weekly grid (the grid is an aggregate,
  so a cell has no single entry id).
- `GET /api/users` — lightweight directory for team pickers.
- Archiving for clients and projects; deletion is blocked once history exists.
- **Clean-slate seeding**: `Seed:DemoData` now defaults to `false`. Roles + the bootstrap
  admin are always seeded so an empty database can never lock you out.

### 2026-07-13 — User management + one-time-password first login
- `ApplicationUser`: added `MustChangePassword`, `LastLoginAt`, `CreatedAt` (+ migration).
- Seeded a dedicated **`admin@etech.io`** (Admin) — previously no user held the Admin role.
- **Admin user management**: list/search/filter, create (with generated one-time password),
  update profile, set roles, activate/deactivate (soft), reset password.
- **Forced password change**: OTP logins get a restricted token (`must_change_password` claim);
  `MustChangePasswordFilter` 403s all endpoints except change-password/me/logout.
- `POST /api/auth/change-password` serves both forced and voluntary changes.
- Login now blocks deactivated accounts and records `LastLoginAt`.
- Safety guards: no self-deactivation, no self-role-change, last-admin protection.
- `AppException` → 4xx ProblemDetails via `AppExceptionHandler`.
- Added `PasswordGenerator` (crypto-random, policy-compliant, no ambiguous chars) + tests.

### 2026-07-13 — Manager, reports & notifications (B6–B8)
- **Approvals**: list (+ pending filter), approve/reject/bulk-approve, and an audit trail.
  Decisions write an `AuditLogEntry` and notify the employee.
- **Team**: utilization, missing timesheets, top performers.
- **Dashboards**: employee (today/week hours, billable %, pending weeks) and manager
  (pending approvals, missing, utilization, projects at risk) aggregates.
- **Reports**: budget/spend, est-vs-actual, client billing, billable split, avg utilization.
- **Notifications**: list with unread count + relative labels, mark-all-read.
- Global error handling via RFC-9457 `ProblemDetails`; `AppRoles` moved to Domain so the
  Application layer no longer reaches into Infrastructure.
- Added xUnit tests for formatting/label mapping (8 passing).
- All endpoints verified live against SQL Server.

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
