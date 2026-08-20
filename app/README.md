# Cadence — Time & Project Management (frontend)

**Cadence** is a multi-tenant **time tracking + project management** SaaS, built in
React + TypeScript, light **and** dark themes. Organizations self-register and each gets its
own isolated users, projects and timesheets.

The **product** brand ("Cadence") lives in `src/config/brand.ts`; each tenant **organization**
keeps its own name, shown in the app once signed in.

> **This README is the living document for the app.** It is updated with every meaningful
> change. See the [Changelog](#changelog) at the bottom.

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Build tool | Vite 8 (Rolldown) |
| UI | React 19 |
| Language | TypeScript (strict) |
| Routing | React Router 7 |
| State | Zustand 5 |
| Styling | CSS custom-property tokens + CSS Modules |
| Fonts | Instrument Sans (Google Fonts) |

No component/UI framework — all primitives are hand-built against the design tokens so the
output matches the mockup exactly.

---

## Quick start

**Prerequisites:** Node.js (recommended **20.19+** or **22.12+** for Vite 8; it also runs on
20.15 with a warning), **and the backend API running** (see [`../backend`](../backend)) — the
app has no mock data, so every screen needs the API.

```bash
# 1. start the backend (separate terminal)
cd backend/src/Tspm.Api && dotnet run     # → http://localhost:5041

# 2. start the frontend
cd app
npm install
npm run dev
```

The API base URL comes from `.env`:

```
VITE_API_URL=http://localhost:5041
```

On first run the database is empty — click **“Create an organization”** on the login screen
(or go to `/register`) to set up your workspace. You become its administrator, and from there
you create users, clients and projects in the app (see [Entering data](#entering-data)).

**Other scripts**

```bash
npm run build    # type-check (tsc -b) + production build to dist/
npm run preview  # preview the production build
npm run lint     # oxlint
```

> **Windows note:** Vite 8's Rolldown needs a platform-native binary
> (`@rolldown/binding-win32-x64-msvc`). It is pinned in `optionalDependencies`. If a build
> ever fails with *"Cannot find native binding"*, run:
> `rm -rf node_modules package-lock.json && npm install`.

---

## Project structure

```
app/
├─ index.html                 # fonts + root mount
├─ src/
│  ├─ main.tsx                # entry; applies theme/accent before first paint
│  ├─ App.tsx                 # RouterProvider
│  ├─ router.tsx              # routes + auth gate
│  │
│  ├─ config/
│  │  ├─ brand.ts             # ⭐ WHITE-LABEL config (name, logo, hero, clients, accent, user)
│  │  └─ nav.ts               # sidebar sections + per-route titles
│  │
│  ├─ styles/
│  │  ├─ tokens.css           # light/dark design tokens + .sidebar-ink tone
│  │  └─ global.css           # reset, scrollbars, keyframes, helpers
│  │
│  ├─ lib/
│  │  ├─ apiClient.ts         # fetch wrapper: bearer token, 401→refresh→retry, ProblemDetails
│  │  ├─ dates.ts             # Monday-first week maths for the timesheet grids
│  │  └─ time.ts              # clock/duration parsing + hours auto-calculation
│  │
│  ├─ services/              # one module per API area (all typed)
│  │  ├─ authService.ts       # login, change-password, me, logout
│  │  ├─ usersService.ts      # admin user management
│  │  ├─ projectsService.ts   # projects, clients, user directory
│  │  ├─ timesheetService.ts  # time entries, weekly grid, submit, cell upsert
│  │  └─ workspaceService.ts  # dashboards, tasks, team, approvals, reports, notifications
│  │
│  ├─ store/
│  │  ├─ useUiStore.ts        # theme, accent, sidebar tone, density, panels, toast
│  │  ├─ useAuthStore.ts      # real auth: tokens, session restore, hasRole()
│  │  └─ useWorkspaceStore.ts # live approvals badge + notification bell
│  │
│  ├─ components/             # reusable primitives
│  │  ├─ Button, Card, Badge, ProgressBar, Ring, Avatar,
│  │  ├─ KpiCard, Icon, Toast, PageContainer, Modal
│  │  └─ index.ts             # barrel export
│  │
│  ├─ layout/                 # app chrome
│  │  ├─ AppShell.tsx         # grid: sidebar + topbar + content; global ⌘K/Esc
│  │  ├─ Sidebar.tsx, TopBar.tsx
│  │  ├─ NotificationPanel.tsx, CommandPalette.tsx, TweaksPanel.tsx
│  │
│  └─ features/              # one folder per screen
│     ├─ auth/LoginPage.tsx
│     ├─ dashboard/          # DashboardPage + HoursBarChart
│     ├─ daily/              # DailyEntryPage (editable entry grid)
│     ├─ weekly/             # WeeklyTimesheetPage (editable week grid)
│     ├─ approvals/          # ApprovalsPage (table + bulk + audit trail)
│     ├─ manager/            # ManagerDashboardPage (Team Overview)
│     ├─ projects/           # ProjectsPage (filterable cards)
│     └─ reports/            # ReportsPage (SVG trend, donut, tables)
```

Path alias: `@/` → `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).

---

## Screens

**Every screen reads the live API — the app ships no mock data.**

| Route | Screen | Role |
| --- | --- | --- |
| `/login` | Login (split hero + SSO/email) | Public |
| `/register` | Create an organization (public signup) | Public |
| `/change-password` | Set / change password | All |
| `/dashboard` | Employee Dashboard | All |
| `/daily` | Daily Timesheet Entry | All |
| `/weekly` | Weekly Timesheet | All |
| `/attendance` | Attendance — today + last 30 days | All |
| `/projects` | Projects + Clients | view: All · manage: Manager/Admin |
| `/team` | Team Overview | Manager/Admin |
| `/approvals` | Approvals | Manager/Admin |
| `/reports` | Reports | Manager/Admin |
| `/admin/users` | User Management | Admin |
| `/admin/offices` | Offices (check-in geofences) | Admin |

Every screen has explicit **loading, error and empty** states, so a fresh workspace reads as
intentional rather than broken.

## Entering data

A new workspace starts empty. The order that unblocks everything:

1. **Create an organization** at `/register` — you become its admin.
2. **Admin → Users** — add people (each gets a one-time password).
3. **Projects → Manage clients** — add a client.
4. **Projects → New project** — set estimate, budget, **hourly rate**, and assign the team.
5. **Daily Entry** / **Weekly Timesheet** — log time against that project.
6. **Weekly → Submit** — the week locks and appears under **Approvals**.

Spend, budget %, utilization and every report figure are **computed from logged time** —
nothing is entered twice.

### Logging hours
Two interchangeable ways, per entry:
- Type **hours** directly, or
- fill in **start** and **end** (plus an optional **break**) and hours are calculated —
  `09:00`–`17:00` less `0:30` = **7.5h**.

The hours field is outlined in the accent colour when it was derived, and typing over it always
wins. Times accept `9`, `9:30`, `09:00` or `0930`; breaks accept `0:30` or `30` (minutes).
If the input is ambiguous (e.g. end ≤ start) it refuses to guess and leaves your hours alone.

## Authentication & organizations

- Real JWT auth against the backend. Tokens are persisted in `localStorage`
  (`lib/apiClient.ts`), and a **401 transparently refreshes and retries** the request once.
- `useAuthStore` exposes `register`, `login`, `changePassword`, `logout`, `restore` (session
  rehydrate on boot) and `hasRole()`. The signed-in `user` carries its `organizationId` +
  `organizationName`.
- **Multi-tenant:** the app is scoped to the signed-in user's organization end-to-end (the
  backend isolates by tenant). The sidebar shows the current organization as a workspace chip
  under the Cadence wordmark.
- **Public signup:** `/register` creates a new organization and its first admin.
- **Role-gated UI:** the sidebar's `ADMIN` section and the `/admin/*` routes only render for
  users holding the `Admin` role.

### One-time-password first login
An admin creates a user and is shown a **one-time password exactly once**. When that user signs
in, they're pinned to `/change-password` — the router guard blocks every other route, and the
backend independently 403s any other API call until the password is changed. Once changed, they
land on the dashboard with normal access.

---

## Architecture notes

### Design tokens & theming
All color/spacing lives in CSS custom properties in `styles/tokens.css`. Light is the
default; `html[data-theme="dark"]` overrides. The UI store writes `data-theme` and `--accent`
onto `<html>`, so **dark mode and accent changes propagate automatically** to every component.

### State
- **`useUiStore`** — appearance (theme, accent, sidebar tone, density) + transient UI
  (command palette, notifications, tweaks panel, toast).
- **`useAuthStore`** — real auth: tokens, session restore on boot, `hasRole()`.
- **`useWorkspaceStore`** — cross-screen counters shown in the chrome (pending-approvals
  badge, notification bell), refreshed by the screens that change them.

### Data layer
There is **no client-side data store and no mock data**. Screens fetch from `services/*`
through `lib/apiClient.ts` and own their loading/error/empty state. Derived figures
(spend, budget %, utilization, billable split) are **computed server-side from logged
time**, so the UI never recalculates business numbers.

`apiClient` attaches the bearer token and, on a `401`, **transparently refreshes and retries
the request once** before giving up.

---

## Re-branding (white-label)

Edit **`src/config/brand.ts`**:

```ts
export const brand = {
  name: 'eTech',                 // workspace/product name
  suffix: 'Timesheet',           // secondary word next to the name
  logoMark: 'e',                 // single-char logo tile
  heroTitle: 'Time, accounted for.',
  heroSubtitle: '…',
  signInSubtitle: 'Sign in to your eTech workspace',
  clients: ['Nexbank', 'Vertex Retail', 'MedCore Health', 'GreenGrid Energy'],
  defaultAccent: '#4757E6',      // brand accent (also selectable in the tweaks panel)
};

export const currentUser = {
  name: 'Alex Morgan',
  role: 'Senior Consultant',
  initials: 'AM',
  email: 'alex.morgan@etech.io',
};
```

Changing these updates the login hero, sidebar, titles, and demo user everywhere. To change
the default palette, also update `defaultAccent` (or edit the accent options in
`layout/TweaksPanel.tsx`).

---

## Known limitations / future work

- **Desktop-first** — enforces a min width like the mockup; no mobile/responsive layouts yet.
- **Accessibility** — custom checkboxes/toggles/palette are mouse-first; ARIA + keyboard
  hardening is future work.
- **Reports omit revenue/margin** — those need a bill-rate vs. cost-rate split (a finance
  module). Budget, spend, hours and utilization are reported today.
- **No PDF/Excel export yet** — the export buttons from the mockup aren't wired.
- **Node/Vite** — Vite 8 prefers Node 20.19+/22.12+; builds on 20.15 with a warning.

---

## Changelog

Newest first. Update this on every meaningful change.

### 2026-07-20 — Same-origin production build (MonsterASP.NET deploy)
- **API base is now relative in production.** `apiClient` uses `VITE_API_URL ?? ''`, and the new
  `.env.production` leaves it empty, so a production build calls `/api/...` on its own origin. In
  UAT the .NET API serves this SPA from `wwwroot`, so there's no separate API host and no CORS.
  Dev is unchanged — `.env` still points at the local API on `:5041`.
- Deploy tooling and runbook live in the backend: `backend/deploy/build-uat.ps1` and
  `backend/deploy/README-UAT.md`.

### 2026-07-19 — Attendance: check in / out with location
- **Top-bar check-in widget** (`layout/CheckInWidget.tsx`) — a status pill plus a check in/out
  button on every screen; the elapsed time ticks each minute.
- **New `/attendance` page** — today's card plus the last 30 days grouped by date. Each event
  shows where it happened (office name or “Off-site”), the GPS accuracy as `±Nm`, and links out
  to Google Maps.
- **New Admin → Offices page** — manage geofences, with a **“Use my current location”** button
  so you can stand in the office and capture its coordinates instead of looking them up.
- **Team Overview gains “Who's in today”** — live presence for managers.
- **Daily Entry shows a present-vs-logged hint** — informational only, never enforced, and
  hidden entirely when nothing is recorded yet.
- **Location is always optional.** `captureLocation()` never rejects — a denied permission or a
  failed fix resolves to a status the UI reports honestly, and the check-in still goes through.
- **Fixed a latent modal bug affecting every dialog in the app.** `Modal` now renders through a
  **React portal to `document.body`**. `PageContainer`'s fade-in animation leaves a non-`none`
  identity `transform`, which makes it the containing block for `position: fixed` descendants —
  so modal backdrops were being clipped to the page area instead of covering the viewport
  (measured: `1202×241` inside a `1440×1000` window; now correctly `1440×1000`).

### 2026-07-18 — Cadence rebrand + multi-tenant organizations
- **Rebranded the product to Cadence** (`brand.ts`); each tenant organization keeps its own
  name, shown in-app.
- **New `/register` page** — public organization signup with a live password checklist; linked
  from the login page. On success you're signed in as the org's admin.
- Extracted a shared `AuthShell` (split hero) used by both Login and Register.
- `useAuthStore.register`; the signed-in `user` now carries `organizationId` +
  `organizationName`.
- The **sidebar shows the current organization** as a workspace chip under the wordmark.

### 2026-07-14 — Live data: every screen on the real API; all mock data deleted
- **Deleted `lib/mockData.ts`, `store/useTimesheetStore.ts`, `lib/calc.ts`, `lib/types.ts`.**
  The app no longer ships any mock data — every screen reads the database.
- **Projects + Clients**: full management UI (create/edit project with client, colour,
  estimate, budget, **hourly rate**, due date, health and team; archive; manage clients).
- **Daily Entry**: real dates and day strip; add/edit/delete entries against real projects.
  Hours can be typed directly **or auto-calculated from start/end minus break**
  (`lib/time.ts`). Editing no longer refetches the grid — inputs are controlled and only the
  edited row is saved, so typing is smooth and values never get clobbered.
- **Weekly Timesheet**: real week navigation, cells upsert on blur, submit locks the week.
- **Dashboard / Team / Approvals / Reports**: all live, including working approve / reject /
  bulk-approve and a real audit trail.
- **Notifications** + the sidebar **approvals badge** are live (`useWorkspaceStore`); the old
  hardcoded "4" is gone.
- Loading / error / **empty** states on every screen, so a fresh workspace reads as
  intentional rather than broken.
- Command palette's *Submit weekly timesheet* now **navigates** instead of submitting —
  submitting locks the week, so it shouldn't fire from a fuzzy match.
- New `Modal` primitive; `lib/dates.ts` for Monday-first week maths.

### 2026-07-13 — Real auth + user management
- **Replaced simulated auth with the real API.** Added `lib/apiClient.ts` (bearer token,
  401→refresh→retry, ProblemDetails parsing) and `services/authService.ts` + `usersService.ts`.
- `useAuthStore` rewritten: real login, token persistence, session restore, `hasRole()`.
- Login page now takes real credentials with error + loading states.
- **New `/change-password`** screen with a live password-rules checklist. Serves both the forced
  first-login change (one-time password) and voluntary changes.
- **Router guards:** a user on a one-time password is pinned to `/change-password`; `/admin/*`
  is Admin-only.
- **New `/admin/users`** — user management: searchable/filterable table, add user (reveals the
  one-time password once, with copy), edit profile + roles, reset password, activate/deactivate.
- Sidebar gained a role-gated **ADMIN** section.
- New `Modal` primitive.

### 2026-07-12 — Initial build
- Scaffolded Vite + React 19 + TypeScript; added React Router + Zustand.
- Ported design tokens (light/dark) and built the primitive component library.
- Built typed data layer + mock data + derived-calculation helpers and the three stores.
- Built the app shell: sidebar, topbar, routing + auth gate, command palette (⌘K),
  notifications, appearance tweaks (accent / Ink sidebar / density), toasts.
- Built all 9 screens (Login, Dashboard, Daily Entry, Weekly Timesheet, Approvals, Team
  Overview, Projects, Reports) — verified against the mockup in light and dark.
- Added `config/brand.ts` white-label config so the app re-skins from one file.
