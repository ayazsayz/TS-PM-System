using Microsoft.EntityFrameworkCore;
using Tspm.Domain.Entities;

namespace Tspm.Application.Common.Interfaces;

/// <summary>
/// DbContext abstraction the Application layer depends on, so services stay
/// free of the concrete EF Core context. Implemented by AppDbContext.
/// </summary>
public interface IAppDbContext
{
    DbSet<Client> Clients { get; }
    DbSet<Project> Projects { get; }
    DbSet<ProjectMember> ProjectMembers { get; }
    DbSet<TimeEntry> TimeEntries { get; }
    DbSet<Timesheet> Timesheets { get; }
    DbSet<TodoTask> TodoTasks { get; }
    DbSet<AuditLogEntry> AuditLog { get; }
    DbSet<Notification> Notifications { get; }

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
