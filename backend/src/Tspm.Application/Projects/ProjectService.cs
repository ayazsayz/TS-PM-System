using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common;
using Tspm.Application.Common.Interfaces;
using Tspm.Domain.Entities;
using Tspm.Domain.Enums;

namespace Tspm.Application.Projects;

public interface IProjectService
{
    Task<IReadOnlyList<ProjectDto>> GetAllAsync(string? filter, bool includeArchived = false);
    Task<IReadOnlyList<MyProjectDto>> GetMineAsync(Guid userId);
    Task<ProjectDto?> GetByIdAsync(Guid id);
    Task<ProjectDto> CreateAsync(UpsertProjectRequest request);
    Task<ProjectDto?> UpdateAsync(Guid id, UpsertProjectRequest request);
    Task<ProjectDto?> SetArchivedAsync(Guid id, bool archived);
    Task<bool> DeleteAsync(Guid id);
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

    public async Task<IReadOnlyList<ProjectDto>> GetAllAsync(string? filter, bool includeArchived = false)
    {
        var query = _db.Projects.AsNoTracking().Include(p => p.Client).Include(p => p.Members);
        var projects = await (includeArchived ? query : query.Where(p => !p.IsArchived)).ToListAsync();

        var filtered = projects.Where(p => Matches(p, filter)).ToList();

        var hours = await ActualHoursByProjectAsync();
        var directory = await _users.GetManyAsync(filtered.SelectMany(p => p.Members.Select(m => m.UserId)));

        return filtered.Select(p => Map(p, hours, directory)).ToList();
    }

    public async Task<IReadOnlyList<MyProjectDto>> GetMineAsync(Guid userId)
    {
        var projects = await _db.Projects
            .AsNoTracking()
            .Include(p => p.Client)
            .Where(p => !p.IsArchived && p.Members.Any(m => m.UserId == userId))
            .OrderByDescending(p => p.CompletionPct)
            .ToListAsync();

        return projects
            .Select(p => new MyProjectDto(p.Id, p.Name, p.Client.Name, p.ColorHex, p.CompletionPct))
            .ToList();
    }

    public async Task<ProjectDto?> GetByIdAsync(Guid id)
    {
        var p = await _db.Projects.AsNoTracking()
            .Include(x => x.Client).Include(x => x.Members)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return null;

        var hours = await ActualHoursByProjectAsync(id);
        var directory = await _users.GetManyAsync(p.Members.Select(m => m.UserId));
        return Map(p, hours, directory);
    }

    public async Task<ProjectDto> CreateAsync(UpsertProjectRequest request)
    {
        await EnsureClientExistsAsync(request.ClientId);

        var project = new Project { Id = Guid.NewGuid() };
        Apply(project, request);
        project.Members = request.TeamUserIds
            .Distinct()
            .Select(uid => new ProjectMember { ProjectId = project.Id, UserId = uid })
            .ToList();

        _db.Projects.Add(project);
        await _db.SaveChangesAsync();
        return (await GetByIdAsync(project.Id))!;
    }

    public async Task<ProjectDto?> UpdateAsync(Guid id, UpsertProjectRequest request)
    {
        var project = await _db.Projects.Include(p => p.Members).FirstOrDefaultAsync(p => p.Id == id);
        if (project is null) return null;

        await EnsureClientExistsAsync(request.ClientId);
        Apply(project, request);

        // Reconcile team membership.
        var target = request.TeamUserIds.Distinct().ToHashSet();
        var current = project.Members.Select(m => m.UserId).ToHashSet();

        foreach (var member in project.Members.Where(m => !target.Contains(m.UserId)).ToList())
            project.Members.Remove(member);

        foreach (var uid in target.Except(current))
            project.Members.Add(new ProjectMember { ProjectId = project.Id, UserId = uid });

        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<ProjectDto?> SetArchivedAsync(Guid id, bool archived)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == id);
        if (project is null) return null;
        project.IsArchived = archived;
        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    /// <summary>Hard delete — blocked once time has been logged against the project.</summary>
    public async Task<bool> DeleteAsync(Guid id)
    {
        var project = await _db.Projects.Include(p => p.Members).FirstOrDefaultAsync(p => p.Id == id);
        if (project is null) return false;

        if (await _db.TimeEntries.AnyAsync(e => e.ProjectId == id))
            throw AppException.BadRequest(
                "Time has already been logged against this project. Archive it instead.");

        _db.Projects.Remove(project);
        await _db.SaveChangesAsync();
        return true;
    }

    // ---- helpers ----

    private async Task EnsureClientExistsAsync(Guid clientId)
    {
        if (!await _db.Clients.AnyAsync(c => c.Id == clientId))
            throw AppException.BadRequest("The selected client does not exist.");
    }

    /// <summary>Actual hours per project, summed live from time entries.</summary>
    private async Task<Dictionary<Guid, decimal>> ActualHoursByProjectAsync(Guid? projectId = null)
    {
        var query = _db.TimeEntries.AsNoTracking();
        if (projectId is { } id) query = query.Where(e => e.ProjectId == id);

        return await query
            .GroupBy(e => e.ProjectId)
            .Select(g => new { g.Key, Hours = g.Sum(e => e.Hours) })
            .ToDictionaryAsync(x => x.Key, x => x.Hours);
    }

    private static void Apply(Project p, UpsertProjectRequest r)
    {
        p.Name = r.Name.Trim();
        p.ClientId = r.ClientId;
        p.ColorHex = string.IsNullOrWhiteSpace(r.ColorHex) ? "#4757E6" : r.ColorHex;
        p.EstimatedHours = r.EstimatedHours;
        p.Budget = r.Budget;
        p.HourlyRate = r.HourlyRate;
        p.DueDate = r.DueDate;
        p.Health = ParseHealth(r.Health);
        p.CompletionPct = Math.Clamp(r.CompletionPct, 0, 100);
        p.WarnNote = string.IsNullOrWhiteSpace(r.Warn) ? null : r.Warn;
        p.IsInternal = r.IsInternal;
    }

    /// <summary>Accepts both enum names ("OnTrack") and UI labels ("On track").</summary>
    private static ProjectHealth ParseHealth(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return ProjectHealth.OnTrack;
        var normalized = value.Replace(" ", string.Empty);
        return Enum.TryParse<ProjectHealth>(normalized, ignoreCase: true, out var health)
            ? health
            : ProjectHealth.OnTrack;
    }

    private static bool Matches(Project p, string? filter) => (filter?.ToLowerInvariant()) switch
    {
        null or "" or "all" => true,
        "running" => p.Health != ProjectHealth.Completed,
        "at-risk" or "atrisk" => RiskSet.Contains(p.Health),
        "completed" => p.Health == ProjectHealth.Completed,
        _ => true,
    };

    private static ProjectDto Map(
        Project p,
        IReadOnlyDictionary<Guid, decimal> hoursByProject,
        IReadOnlyDictionary<Guid, UserSummary> directory)
    {
        hoursByProject.TryGetValue(p.Id, out var actualHours);
        var spent = actualHours * p.HourlyRate;
        var budgetPct = p.Budget == 0 ? 0 : (int)Math.Round(spent / p.Budget * 100);

        var team = p.Members
            .Select(m => directory.TryGetValue(m.UserId, out var u)
                ? new TeamMemberDto(m.UserId, u.Initials, u.AvatarColor, u.FullName)
                : new TeamMemberDto(m.UserId, "?", "#475467", "Unknown"))
            .ToList();

        return new ProjectDto(
            p.Id,
            p.Name,
            p.ClientId,
            p.Client?.Name ?? "",
            p.ColorHex,
            p.EstimatedHours,
            actualHours,
            p.EstimatedHours - actualHours,
            p.Budget,
            p.HourlyRate,
            spent,
            budgetPct,
            p.DueDate?.ToString("MMM d"),
            DisplayNames.Health(p.Health),
            p.CompletionPct,
            p.WarnNote,
            p.IsInternal,
            p.IsArchived,
            team);
    }
}
