using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common.Interfaces;
using Tspm.Domain.Entities;
using Tspm.Infrastructure.Identity;

namespace Tspm.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<TimeEntry> TimeEntries => Set<TimeEntry>();
    public DbSet<Timesheet> Timesheets => Set<Timesheet>();
    public DbSet<TodoTask> TodoTasks => Set<TodoTask>();
    public DbSet<AuditLogEntry> AuditLog => Set<AuditLogEntry>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

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
    }
}
