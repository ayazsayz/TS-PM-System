using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Tspm.Domain.Entities;
using Tspm.Domain.Enums;
using Tspm.Infrastructure.Identity;

namespace Tspm.Infrastructure.Persistence;

/// <summary>
/// Applies migrations and seeds the demo dataset ported from the frontend
/// mock data, so the API returns the same numbers the UI already shows.
/// Idempotent: guarded by existence checks.
/// </summary>
public static class DbInitializer
{
    /// <summary>Deterministic Guid from a stable key, so FKs line up across runs.</summary>
    public static Guid Id(string key)
    {
        var hash = MD5.HashData(Encoding.UTF8.GetBytes(key));
        return new Guid(hash);
    }

    /// <summary>The demo organization all demo data belongs to (when Seed:DemoData is on).</summary>
    public static readonly Guid DemoOrgId = Id("org:demo");

    public static async Task SeedAsync(
        AppDbContext db,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole<Guid>> roleManager,
        SeedOptions options)
    {
        await db.Database.MigrateAsync();
        if (!options.Enabled) return;

        // Roles are global and always seeded. There is no bootstrap admin: organizations
        // (and their first admin) are created via public registration.
        await SeedRolesAsync(roleManager);

        if (!options.DemoData) return;

        // Everything demo lives inside one demo organization.
        if (!await db.Organizations.AnyAsync(o => o.Id == DemoOrgId))
        {
            db.Organizations.Add(new Organization
            {
                Id = DemoOrgId,
                Name = "eTech (Demo)",
                Slug = "etech-demo",
                IsActive = true,
            });
            await db.SaveChangesAsync();
        }

        await SeedDemoUsersAsync(userManager, options.DemoPassword);

        if (!await db.Clients.IgnoreQueryFilters().AnyAsync(c => c.OrganizationId == DemoOrgId))
        {
            SeedClientsAndProjects(db);
            SeedTasks(db);
            SeedAlexEntries(db);
            SeedTimesheets(db);
            SeedAuditLog(db);
            SeedNotifications(db);

            // Stamp every new tenant row with the demo org (no HttpContext here, so the
            // context's automatic stamping is inactive).
            foreach (var entry in db.ChangeTracker.Entries<Tspm.Domain.Common.IHasOrganization>())
                if (entry.State == EntityState.Added && entry.Entity.OrganizationId == Guid.Empty)
                    entry.Entity.OrganizationId = DemoOrgId;

            await db.SaveChangesAsync();
        }
    }

    private static string InitialsOf(string name)
    {
        var parts = name.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0) return "?";
        if (parts.Length == 1) return parts[0][..Math.Min(2, parts[0].Length)].ToUpperInvariant();
        return $"{char.ToUpperInvariant(parts[0][0])}{char.ToUpperInvariant(parts[^1][0])}";
    }

    // ---- Roles ----
    private static async Task SeedRolesAsync(RoleManager<IdentityRole<Guid>> roleManager)
    {
        foreach (var role in Roles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole<Guid>(role) { Id = Id($"role:{role}") });
        }
    }

    // ---- Users ----
    private record SeedUser(string Key, string Email, string Name, string Initials, string Title, string Dept, string Color, string[] Roles);

    private static readonly SeedUser[] Users =
    [
        new("alex", "alex.morgan@etech.io", "Alex Morgan", "AM", "Senior Consultant", "Delivery", "#475467", [Identity.Roles.Employee, Identity.Roles.Manager]),
        new("sarah", "sarah.chen@etech.io", "Sarah Chen", "SC", "Consultant", "Engineering", "#4757E6", [Identity.Roles.Employee]),
        new("marcus", "marcus.webb@etech.io", "Marcus Webb", "MW", "Consultant", "Engineering", "#0E9384", [Identity.Roles.Employee]),
        new("priya", "priya.sharma@etech.io", "Priya Sharma", "PS", "Consultant", "Data", "#B54708", [Identity.Roles.Employee]),
        new("diego", "diego.ruiz@etech.io", "Diego Ruiz", "DR", "Designer", "Design", "#7839EE", [Identity.Roles.Employee]),
        new("lena", "lena.fischer@etech.io", "Lena Fischer", "LF", "Consultant", "Engineering", "#C11574", [Identity.Roles.Employee]),
        new("tom", "tom.okafor@etech.io", "Tom Okafor", "TO", "Analyst", "Data", "#175CD3", [Identity.Roles.Employee]),
        new("amy", "amy.park@etech.io", "Amy Park", "AP", "Consultant", "Engineering", "#0E9384", [Identity.Roles.Employee]),
        new("dana", "dana.whitfield@etech.io", "Dana Whitfield", "DW", "Delivery Manager", "Delivery", "#B54708", [Identity.Roles.Manager]),
    ];

    private static async Task SeedDemoUsersAsync(UserManager<ApplicationUser> userManager, string demoPassword)
    {
        foreach (var u in Users)
        {
            if (await userManager.FindByEmailAsync(u.Email) is not null) continue;
            var user = new ApplicationUser
            {
                Id = Id($"user:{u.Key}"),
                OrganizationId = DemoOrgId,
                UserName = u.Email,
                Email = u.Email,
                EmailConfirmed = true,
                FullName = u.Name,
                Initials = u.Initials,
                Title = u.Title,
                Department = u.Dept,
                AvatarColor = u.Color,
            };
            await userManager.CreateAsync(user, demoPassword);
            await userManager.AddToRolesAsync(user, u.Roles);
        }
    }

    private static Guid U(string key) => Id($"user:{key}");

    // ---- Clients + Projects ----
    private record SeedProject(string Key, string Name, string ClientKey, string Color, int Est, int Act, decimal Budget, decimal Spent, DateOnly? Due, ProjectHealth Health, int Completion, string? Warn, bool Internal, string[] Team);

    private static readonly (string Key, string Name)[] Clients =
    [
        ("nexbank", "Nexbank"),
        ("vertex", "Vertex Retail"),
        ("medcore", "MedCore Health"),
        ("greengrid", "GreenGrid Energy"),
        ("etech", "eTech"),
    ];

    private static readonly SeedProject[] Projects =
    [
        new("aurora", "Aurora Cloud Migration", "nexbank", "#4757E6", 1200, 860, 180000, 122000, new(2026, 8, 14), ProjectHealth.OnTrack, 72, null, false, ["sarah", "marcus", "alex"]),
        new("helios", "Helios ERP Rollout", "vertex", "#0E9384", 2400, 2310, 310000, 296000, new(2026, 7, 31), ProjectHealth.AtRisk, 88, "96% of estimated hours consumed", false, ["priya", "lena", "tom", "alex"]),
        new("atlas", "Atlas Mobile Banking", "nexbank", "#B54708", 900, 1010, 140000, 152000, new(2026, 7, 10), ProjectHealth.OverBudget, 94, "Over budget · 110h over estimate", false, ["marcus", "diego"]),
        new("orion", "Orion Data Platform", "medcore", "#7839EE", 1600, 610, 220000, 78000, new(2026, 10, 2), ProjectHealth.OnTrack, 38, null, false, ["alex", "priya", "tom"]),
        new("zephyr", "Zephyr Portal Redesign", "greengrid", "#C11574", 480, 495, 64000, 61000, new(2026, 7, 8), ProjectHealth.Delayed, 92, "Delayed · due in 5 days", false, ["diego", "lena"]),
        new("titan", "Titan DevOps Enablement", "vertex", "#175CD3", 700, 698, 95000, 93000, new(2026, 6, 20), ProjectHealth.Completed, 100, null, false, ["sarah", "tom"]),
        new("internal", "Internal · Training & Ops", "etech", "#667085", 0, 0, 0, 0, null, ProjectHealth.OnTrack, 0, null, true, []),
    ];

    private static Guid P(string key) => Id($"proj:{key}");

    private static void SeedClientsAndProjects(AppDbContext db)
    {
        foreach (var (key, name) in Clients)
            db.Clients.Add(new Client { Id = Id($"client:{key}"), Name = name });

        foreach (var p in Projects)
        {
            db.Projects.Add(new Project
            {
                Id = P(p.Key),
                Name = p.Name,
                ClientId = Id($"client:{p.ClientKey}"),
                ColorHex = p.Color,
                EstimatedHours = p.Est,
                Budget = p.Budget,
                // Actual hours and spend are computed from logged time; the demo's
                // blended rate is back-derived from its original spent/actual figures.
                HourlyRate = p.Act > 0 ? Math.Round(p.Spent / p.Act, 2) : 0m,
                DueDate = p.Due,
                Health = p.Health,
                CompletionPct = p.Completion,
                WarnNote = p.Warn,
                IsInternal = p.Internal,
                Members = p.Team.Select(t => new ProjectMember { ProjectId = P(p.Key), UserId = U(t) }).ToList(),
            });
        }
    }

    // ---- Tasks (Alex) ----
    private static void SeedTasks(AppDbContext db)
    {
        var alex = U("alex");
        (string label, string proj, bool done, string due, bool urgent)[] tasks =
        [
            ("Finalize payment API error states", "aurora", false, "Today", true),
            ("Prepare demo for Nexbank steering committee", "aurora", false, "Mon", false),
            ("Review Orion entity mapping document", "orion", false, "Jul 8", false),
            ("Update Helios support runbook", "helios", false, "Jul 11", false),
            ("Submit June expense report", "internal", true, "Done", false),
        ];
        var i = 0;
        foreach (var (label, proj, done, due, urgent) in tasks)
            db.TodoTasks.Add(new TodoTask
            {
                Id = Id($"task:{i++}"),
                UserId = alex,
                ProjectId = P(proj),
                Label = label,
                IsDone = done,
                DueLabel = due,
                IsUrgent = urgent,
            });
    }

    // ---- Alex's current-week time entries (Jun 29 – Jul 3, 2026) ----
    private static void SeedAlexEntries(AppDbContext db)
    {
        var alex = U("alex");
        // (dayOffset, project, task, desc, start, end, break, billable, hours)
        (int day, string proj, string task, string desc, string start, string end, string brk, bool bill, decimal hrs)[] rows =
        [
            (0, "aurora", "API integration", "Payment gateway endpoints + error handling", "09:00", "13:30", "0:30", true, 4),
            (0, "orion", "Architecture", "Entity model draft for claims domain", "13:30", "16:00", "", true, 2.5m),
            (0, "helios", "Support", "Helios ticket triage — priority queue", "16:00", "17:30", "", true, 1.5m),
            (1, "aurora", "Development", "Migration scripts for account service", "09:00", "12:30", "", true, 3.5m),
            (1, "orion", "Workshops", "Data mapping workshop with MedCore", "13:00", "16:00", "", true, 3),
            (1, "internal", "Training", "Security awareness module", "16:00", "16:30", "", false, 0.5m),
            (1, "helios", "Support", "Regression check on invoice batch", "16:30", "17:30", "", true, 1),
            (2, "aurora", "Development", "Auth flow refactor + code review", "09:00", "13:00", "", true, 4),
            (2, "orion", "Architecture", "Pipeline design doc v2", "13:30", "15:30", "", true, 2),
            (2, "helios", "Support", "Hotfix validation with Vertex team", "15:30", "17:30", "", true, 2),
            (3, "aurora", "Development", "Payment gateway sandbox testing", "09:00", "12:30", "", true, 3.5m),
            (3, "orion", "Data model review", "Entity mapping session notes", "13:00", "15:30", "", true, 2.5m),
            (3, "helios", "Support", "Monthly close support window", "15:30", "17:00", "", true, 1.5m),
            (3, "internal", "Team sync", "Chapter meeting", "17:00", "17:30", "", false, 0.5m),
            (4, "aurora", "API integration", "Payment gateway endpoints + error handling", "09:00", "12:30", "0:30", true, 3),
            (4, "aurora", "Sprint planning", "Sprint 14 grooming with Nexbank team", "13:00", "14:00", "", true, 1),
            (4, "orion", "Data model review", "Entity mapping workshop follow-up", "14:00", "16:30", "", true, 2.5m),
        ];
        var weekStart = new DateOnly(2026, 6, 29);
        var i = 0;
        foreach (var r in rows)
            db.TimeEntries.Add(new TimeEntry
            {
                Id = Id($"entry:{i++}"),
                UserId = alex,
                ProjectId = P(r.proj),
                Date = weekStart.AddDays(r.day),
                Task = r.task,
                Description = r.desc,
                StartTime = r.start,
                EndTime = r.end,
                BreakDuration = r.brk,
                IsBillable = r.bill,
                Hours = r.hrs,
            });
    }

    // ---- Timesheets / approvals ----
    private static void SeedTimesheets(AppDbContext db)
    {
        var today = DateTime.UtcNow.Date;
        var jun22 = new DateOnly(2026, 6, 22);

        // Alex's own current week — draft.
        db.Timesheets.Add(new Timesheet
        {
            Id = Id("ts:alex"),
            UserId = U("alex"),
            WeekStart = new DateOnly(2026, 6, 29),
            Status = TimesheetStatus.Draft,
            TotalHours = 38.5m,
            BillablePercent = 90,
        });

        (string key, string user, DateOnly week, TimesheetStatus status, decimal hours, int billable, string? flag, DateTime submitted, string? approver, DateTime? decided, string? comment)[] rows =
        [
            ("ts:sarah", "sarah", jun22, TimesheetStatus.Submitted, 40, 92, null, new(2026, 6, 22, 9, 12, 0), null, null, null),
            ("ts:marcus", "marcus", jun22, TimesheetStatus.Submitted, 38.5m, 84, "1.5h under", new(2026, 6, 22, 11, 40, 0), null, null, null),
            ("ts:priya", "priya", jun22, TimesheetStatus.Submitted, 42, 95, "+2h overtime", new(2026, 6, 21, 20, 5, 0), null, null, null),
            ("ts:diego", "diego", jun22, TimesheetStatus.Submitted, 40, 76, null, new(2026, 6, 22, 8, 30, 0), null, null, null),
            ("ts:lena", "lena", jun22, TimesheetStatus.Approved, 40, 88, null, new(2026, 6, 26, 17, 55, 0), "dana", today.AddHours(8).AddMinutes(47), null),
            ("ts:tom", "tom", new(2026, 6, 15), TimesheetStatus.Rejected, 35, 71, "5h missing", new(2026, 6, 16, 10, 15, 0), "alex", today.AddDays(-1).AddHours(16).AddMinutes(12), "5h missing on Thursday, please complete and resubmit."),
        ];

        foreach (var r in rows)
            db.Timesheets.Add(new Timesheet
            {
                Id = Id(r.key),
                UserId = U(r.user),
                WeekStart = r.week,
                Status = r.status,
                TotalHours = r.hours,
                BillablePercent = r.billable,
                Flag = r.flag,
                SubmittedAt = r.submitted,
                ApproverId = r.approver is null ? null : U(r.approver),
                DecidedAt = r.decided,
                DecisionComment = r.comment,
            });
    }

    // ---- Audit trail ----
    private static void SeedAuditLog(AppDbContext db)
    {
        var today = DateTime.UtcNow.Date;
        (string key, Guid actor, string action, string msg, DateTime ts)[] rows =
        [
            ("audit:0", U("alex"), "timesheet.approved", "You approved Lena Fischer's timesheet — Jun 22 – 28 · 40h", today.AddHours(8).AddMinutes(47)),
            ("audit:1", U("alex"), "timesheet.rejected", "You rejected Tom Okafor's timesheet — Jun 15 – 21 · \"5h missing on Thursday, please complete and resubmit.\"", today.AddDays(-1).AddHours(16).AddMinutes(12)),
            ("audit:2", Guid.Empty, "timesheet.escalated", "System escalation — Tom Okafor's missing timesheet escalated to Department Manager", today.AddDays(-1).AddHours(9)),
            ("audit:3", Guid.Empty, "reminder.sent", "Reminder sent to 3 employees with unsubmitted timesheets", new DateTime(2026, 6, 26, 18, 0, 0)),
        ];
        foreach (var r in rows)
            db.AuditLog.Add(new AuditLogEntry
            {
                Id = Id(r.key),
                ActorId = r.actor,
                Action = r.action,
                TargetType = "Timesheet",
                Message = r.msg,
                Timestamp = r.ts,
            });
    }

    // ---- Notifications (Alex) ----
    private static void SeedNotifications(AppDbContext db)
    {
        var alex = U("alex");
        var now = DateTime.UtcNow;
        (string key, string title, string cat, NotificationSeverity sev, DateTime at)[] rows =
        [
            ("notif:0", "Atlas Mobile Banking exceeded its estimated hours by 110h", "Project risk", NotificationSeverity.Warning, now.AddMinutes(-25)),
            ("notif:1", "4 timesheets are awaiting your approval for the week of Jun 22", "Approvals", NotificationSeverity.Info, now.AddHours(-1)),
            ("notif:2", "Tom Okafor hasn't submitted last week's timesheet — escalated to you", "Escalation", NotificationSeverity.Danger, now.AddHours(-3)),
            ("notif:3", "Your timesheet for Jun 15 – 21 was approved by Dana Whitfield", "Timesheet", NotificationSeverity.Success, now.AddDays(-1)),
        ];
        foreach (var r in rows)
            db.Notifications.Add(new Notification
            {
                Id = Id(r.key),
                UserId = alex,
                Title = r.title,
                Category = r.cat,
                Severity = r.sev,
                IsRead = false,
                CreatedAt = r.at,
            });
    }
}
