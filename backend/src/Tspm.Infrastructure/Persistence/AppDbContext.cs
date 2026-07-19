using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common.Interfaces;
using Tspm.Domain.Common;
using Tspm.Domain.Entities;
using Tspm.Infrastructure.Identity;

namespace Tspm.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>, IAppDbContext
{
    private readonly Guid? _tenantId;

    public AppDbContext(DbContextOptions<AppDbContext> options, ICurrentTenant? tenant = null)
        : base(options) => _tenantId = tenant?.OrganizationId;

    /// <summary>Current tenant for query filters (Guid.Empty ⇒ match nothing = fail closed).</summary>
    private Guid TenantId => _tenantId ?? Guid.Empty;

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<TimeEntry> TimeEntries => Set<TimeEntry>();
    public DbSet<Timesheet> Timesheets => Set<Timesheet>();
    public DbSet<TodoTask> TodoTasks => Set<TodoTask>();
    public DbSet<AuditLogEntry> AuditLog => Set<AuditLogEntry>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Office> Offices => Set<Office>();
    public DbSet<AttendanceSession> AttendanceSessions => Set<AttendanceSession>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        b.Entity<Organization>(e =>
        {
            e.Property(o => o.Name).HasMaxLength(160).IsRequired();
            e.Property(o => o.Slug).HasMaxLength(80).IsRequired();
            e.HasIndex(o => o.Slug).IsUnique();
        });

        b.Entity<ApplicationUser>(e =>
        {
            e.Property(u => u.FullName).HasMaxLength(120);
            e.Property(u => u.Initials).HasMaxLength(4);
            e.Property(u => u.Title).HasMaxLength(80);
            e.Property(u => u.Department).HasMaxLength(80);
            e.Property(u => u.AvatarColor).HasMaxLength(9);
            e.Property(u => u.RefreshTokenHash).HasMaxLength(256);
        });

        b.Entity<Client>(e =>
        {
            e.Property(c => c.Name).HasMaxLength(120).IsRequired();
            e.HasMany(c => c.Projects).WithOne(p => p.Client).HasForeignKey(p => p.ClientId);
        });

        b.Entity<Project>(e =>
        {
            e.Property(p => p.Name).HasMaxLength(160).IsRequired();
            e.Property(p => p.ColorHex).HasMaxLength(9);
            e.Property(p => p.WarnNote).HasMaxLength(256);
            e.Property(p => p.Budget).HasPrecision(18, 2);
            e.Property(p => p.HourlyRate).HasPrecision(18, 2);
        });

        b.Entity<ProjectMember>(e =>
        {
            e.HasKey(pm => new { pm.ProjectId, pm.UserId });
            e.HasOne(pm => pm.Project).WithMany(p => p.Members).HasForeignKey(pm => pm.ProjectId);
        });

        b.Entity<TimeEntry>(e =>
        {
            e.Property(t => t.Task).HasMaxLength(160);
            e.Property(t => t.Description).HasMaxLength(512);
            e.Property(t => t.StartTime).HasMaxLength(8);
            e.Property(t => t.EndTime).HasMaxLength(8);
            e.Property(t => t.BreakDuration).HasMaxLength(8);
            e.Property(t => t.Hours).HasPrecision(6, 2);
            e.HasOne(t => t.Project).WithMany(p => p.TimeEntries).HasForeignKey(t => t.ProjectId);
            e.HasIndex(t => new { t.UserId, t.Date });
        });

        b.Entity<Timesheet>(e =>
        {
            e.Property(t => t.TotalHours).HasPrecision(6, 2);
            e.Property(t => t.Flag).HasMaxLength(60);
            e.Property(t => t.DecisionComment).HasMaxLength(512);
            e.HasIndex(t => new { t.UserId, t.WeekStart }).IsUnique();
        });

        b.Entity<TodoTask>(e =>
        {
            e.Property(t => t.Label).HasMaxLength(200).IsRequired();
            e.Property(t => t.DueLabel).HasMaxLength(32);
            e.HasOne(t => t.Project).WithMany().HasForeignKey(t => t.ProjectId).IsRequired(false);
        });

        b.Entity<AuditLogEntry>(e =>
        {
            e.Property(a => a.Action).HasMaxLength(80).IsRequired();
            e.Property(a => a.TargetType).HasMaxLength(80);
            e.Property(a => a.Message).HasMaxLength(512).IsRequired();
            e.HasIndex(a => a.Timestamp);
        });

        b.Entity<Notification>(e =>
        {
            e.Property(n => n.Title).HasMaxLength(200).IsRequired();
            e.Property(n => n.Body).HasMaxLength(512);
            e.Property(n => n.Category).HasMaxLength(60);
            e.HasIndex(n => new { n.UserId, n.IsRead });
        });

        b.Entity<Office>(e =>
        {
            e.Property(o => o.Name).HasMaxLength(120).IsRequired();
            e.HasIndex(o => new { o.OrganizationId, o.Name });
        });

        b.Entity<AttendanceSession>(e =>
        {
            e.HasIndex(a => new { a.UserId, a.LocalDate });
            // At most one open session per user (filtered unique index).
            e.HasIndex(a => a.UserId)
                .IsUnique()
                .HasFilter("[CheckOutAt] IS NULL")
                .HasDatabaseName("UX_AttendanceSessions_OpenPerUser");
            // NoAction: SQL Server rejects multiple cascade paths (two office FKs plus the
            // organization FK). Offices are deactivated rather than deleted, and the service
            // refuses to delete one that attendance history references.
            e.HasOne<Office>().WithMany().HasForeignKey(a => a.CheckInOfficeId)
                .OnDelete(DeleteBehavior.NoAction);
            e.HasOne<Office>().WithMany().HasForeignKey(a => a.CheckOutOfficeId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // ---- Tenancy: FK + index + global query filter on every tenant entity ----
        // ApplicationUser carries OrganizationId too, but is intentionally NOT filtered —
        // login must find a user by (globally-unique) email before a tenant is known.
        b.Entity<ApplicationUser>()
            .HasOne<Organization>().WithMany().HasForeignKey(u => u.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);
        b.Entity<ApplicationUser>().HasIndex(u => u.OrganizationId);

        ConfigureTenant<Client>(b);
        ConfigureTenant<Project>(b);
        ConfigureTenant<ProjectMember>(b);
        ConfigureTenant<TimeEntry>(b);
        ConfigureTenant<Timesheet>(b);
        ConfigureTenant<TodoTask>(b);
        ConfigureTenant<AuditLogEntry>(b);
        ConfigureTenant<Notification>(b);
        ConfigureTenant<Office>(b);
        ConfigureTenant<AttendanceSession>(b);
    }

    private void ConfigureTenant<T>(ModelBuilder b) where T : class, IHasOrganization
    {
        b.Entity<T>().Property(e => e.OrganizationId).IsRequired();
        b.Entity<T>().HasIndex(e => e.OrganizationId);
        b.Entity<T>()
            .HasOne<Organization>().WithMany().HasForeignKey(e => e.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);
        // Instance-level filter — EF re-evaluates TenantId per query on this context.
        b.Entity<T>().HasQueryFilter(e => e.OrganizationId == TenantId);
    }

    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        StampTenant();
        return base.SaveChangesAsync(ct);
    }

    public override int SaveChanges()
    {
        StampTenant();
        return base.SaveChanges();
    }

    /// <summary>
    /// Stamps new tenant rows with the current tenant, so a service can never forget to.
    /// Rows created with an explicit OrganizationId (e.g. registration, which runs before a
    /// tenant context exists) are left untouched.
    /// </summary>
    private void StampTenant()
    {
        if (_tenantId is not Guid tenant) return;
        foreach (var entry in ChangeTracker.Entries<IHasOrganization>())
            if (entry.State == EntityState.Added && entry.Entity.OrganizationId == Guid.Empty)
                entry.Entity.OrganizationId = tenant;
    }
}
