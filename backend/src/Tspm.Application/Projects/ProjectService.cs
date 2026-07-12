using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common;
using Tspm.Application.Common.Interfaces;
using Tspm.Domain.Entities;
using Tspm.Domain.Enums;

namespace Tspm.Application.Projects;

public interface IProjectService
{
    Task<IReadOnlyList<ProjectDto>> GetAllAsync(string? filter);
    Task<IReadOnlyList<MyProjectDto>> GetMineAsync(Guid userId);
    Task<ProjectDto?> GetByIdAsync(Guid id);
}

public class ProjectService : IProjectService
{
    private static readonly HashSet<ProjectHealth> RiskSet =
        [ProjectHealth.AtRisk, ProjectHealth.OverBudget, ProjectHealth.Delayed];

    private readonly IAppDbContext _db;
    private readonly IUserDirectory _users;

    public ProjectService(IAppDbContext db, IUserDirectory users)
    {
        _db = db;
        _users = users;
    }

    public async Task<IReadOnlyList<ProjectDto>> GetAllAsync(string? filter)
    {
        var projects = await _db.Projects
            .AsNoTracking()
            .Include(p => p.Client)
            .Include(p => p.Members)
            .Where(p => !p.IsInternal)
            .ToListAsync();

        var filtered = projects.Where(p => Matches(p, filter)).ToList();

        var memberIds = filtered.SelectMany(p => p.Members.Select(m => m.UserId)).Distinct();
        var directory = await _users.GetManyAsync(memberIds);

        return filtered.Select(p => Map(p, directory)).ToList();
    }

    public async Task<IReadOnlyList<MyProjectDto>> GetMineAsync(Guid userId)
    {
        var projects = await _db.Projects
            .AsNoTracking()
            .Include(p => p.Client)
            .Include(p => p.Members)
            .Where(p => !p.IsInternal && p.Members.Any(m => m.UserId == userId))
            .OrderByDescending(p => p.CompletionPct)
            .ToListAsync();

        return projects
            .Select(p => new MyProjectDto(p.Id, p.Name, p.Client.Name, p.ColorHex, p.CompletionPct))
            .ToList();
    }

    public async Task<ProjectDto?> GetByIdAsync(Guid id)
    {
        var p = await _db.Projects
            .AsNoTracking()
            .Include(x => x.Client)
            .Include(x => x.Members)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return null;

        var directory = await _users.GetManyAsync(p.Members.Select(m => m.UserId));
        return Map(p, directory);
    }

    private static bool Matches(Project p, string? filter) => (filter?.ToLowerInvariant()) switch
    {
        null or "" or "all" => true,
        "running" => p.Health != ProjectHealth.Completed,
        "at-risk" or "atrisk" => RiskSet.Contains(p.Health),
        "completed" => p.Health == ProjectHealth.Completed,
        _ => true,
    };

    private static ProjectDto Map(Project p, IReadOnlyDictionary<Guid, UserSummary> directory)
    {
        var budgetPct = p.Budget == 0 ? 0 : (int)Math.Round(p.Spent / p.Budget * 100);
        var team = p.Members
            .Select(m => directory.TryGetValue(m.UserId, out var u)
                ? new TeamMemberDto(m.UserId, u.Initials, u.AvatarColor)
                : new TeamMemberDto(m.UserId, "?", "#475467"))
            .ToList();

        return new ProjectDto(
            p.Id,
            p.Name,
            p.Client.Name,
            p.ColorHex,
            p.EstimatedHours,
            p.ActualHours,
            p.EstimatedHours - p.ActualHours,
            p.Budget,
            p.Spent,
            budgetPct,
            p.DueDate?.ToString("MMM d"),
            DisplayNames.Health(p.Health),
            p.CompletionPct,
            p.WarnNote,
            p.IsInternal,
            team);
    }
}
