using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common.Interfaces;
using Tspm.Domain.Common;
using Tspm.Domain.Enums;

namespace Tspm.Application.Team;

public interface ITeamService
{
    Task<IReadOnlyList<UtilizationDto>> GetUtilizationAsync();
    Task<IReadOnlyList<MissingTimesheetDto>> GetMissingAsync();
    Task<IReadOnlyList<TopPerformerDto>> GetTopPerformersAsync();
}

public class TeamService : ITeamService
{
    private const decimal WeekHours = 40m;
    private readonly IAppDbContext _db;
    private readonly IUserDirectory _users;

    public TeamService(IAppDbContext db, IUserDirectory users)
    {
        _db = db;
        _users = users;
    }

    /// <summary>Per-employee utilization from their most recent timesheet's hours.</summary>
    public async Task<IReadOnlyList<UtilizationDto>> GetUtilizationAsync()
    {
        var employees = (await _users.GetAllAsync())
            .Where(u => u.Roles.Contains(AppRoles.Employee))
            .ToList();

        var latest = await LatestHoursByUserAsync();

        return employees
            .Select(u =>
            {
                latest.TryGetValue(u.Id, out var hours);
                var pct = (int)Math.Round(hours / WeekHours * 100);
                return new UtilizationDto(u.Id, u.FullName, u.Initials, u.AvatarColor, pct);
            })
            .OrderByDescending(x => x.UtilizationPercent)
            .ToList();
    }

    /// <summary>Employees with no submitted/approved timesheet for the most recent submitted week.</summary>
    public async Task<IReadOnlyList<MissingTimesheetDto>> GetMissingAsync()
    {
        var referenceWeek = await _db.Timesheets
            .Where(t => t.Status == TimesheetStatus.Submitted || t.Status == TimesheetStatus.Approved)
            .OrderByDescending(t => t.WeekStart)
            .Select(t => (DateOnly?)t.WeekStart)
            .FirstOrDefaultAsync();
        if (referenceWeek is not { } week) return [];

        var submittedUserIds = await _db.Timesheets
            .Where(t => t.WeekStart == week &&
                        (t.Status == TimesheetStatus.Submitted || t.Status == TimesheetStatus.Approved))
            .Select(t => t.UserId)
            .ToListAsync();

        var employees = (await _users.GetAllAsync())
            .Where(u => u.Roles.Contains(AppRoles.Employee) && !submittedUserIds.Contains(u.Id))
            .ToList();

        return employees
            .Select(u => new MissingTimesheetDto(u.Id, u.FullName, u.Initials, u.Department ?? "", u.AvatarColor))
            .ToList();
    }

    public async Task<IReadOnlyList<TopPerformerDto>> GetTopPerformersAsync()
    {
        var util = await GetUtilizationAsync();
        return util
            .Take(3)
            .Select((u, i) => new TopPerformerDto(i + 1, u.Name, u.Initials, u.AvatarColor, u.UtilizationPercent))
            .ToList();
    }

    private async Task<Dictionary<Guid, decimal>> LatestHoursByUserAsync()
    {
        var sheets = await _db.Timesheets
            .AsNoTracking()
            .OrderByDescending(t => t.WeekStart)
            .ToListAsync();

        return sheets
            .GroupBy(t => t.UserId)
            .ToDictionary(g => g.Key, g => g.First().TotalHours);
    }
}
