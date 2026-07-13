using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common.Interfaces;
using Tspm.Application.Team;
using Tspm.Domain.Enums;

namespace Tspm.Application.Dashboard;

public interface IDashboardService
{
    Task<EmployeeDashboardDto> GetEmployeeAsync(Guid userId);
    Task<ManagerDashboardDto> GetManagerAsync();
}

public class DashboardService : IDashboardService
{
    private static readonly HashSet<ProjectHealth> RiskSet =
        [ProjectHealth.AtRisk, ProjectHealth.OverBudget, ProjectHealth.Delayed];

    private readonly IAppDbContext _db;
    private readonly ITeamService _team;

    public DashboardService(IAppDbContext db, ITeamService team)
    {
        _db = db;
        _team = team;
    }

    public async Task<EmployeeDashboardDto> GetEmployeeAsync(Guid userId)
    {
        var entries = await _db.TimeEntries.AsNoTracking()
            .Where(e => e.UserId == userId)
            .ToListAsync();

        // Reference day = the user's most recently logged day (keeps the demo meaningful).
        var referenceDate = entries.Count > 0 ? entries.Max(e => e.Date) : DateOnly.FromDateTime(DateTime.Today);
        var weekStart = WeekMonday(referenceDate);
        var weekEnd = weekStart.AddDays(6);

        var today = entries.Where(e => e.Date == referenceDate).ToList();
        var week = entries.Where(e => e.Date >= weekStart && e.Date <= weekEnd).ToList();

        var todayHours = today.Sum(e => e.Hours);
        var weekHours = week.Sum(e => e.Hours);
        var billableHours = week.Where(e => e.IsBillable).Sum(e => e.Hours);
        var billablePct = weekHours == 0 ? 0 : (int)Math.Round(billableHours / weekHours * 100);
        var weekPct = (int)Math.Round(Math.Min(100m, weekHours / 40m * 100));

        // Weeks with logged time but not yet submitted/approved.
        var loggedWeeks = entries.Select(e => WeekMonday(e.Date)).Distinct().ToList();
        var submittedWeeks = await _db.Timesheets
            .Where(t => t.UserId == userId &&
                        (t.Status == TimesheetStatus.Submitted || t.Status == TimesheetStatus.Approved))
            .Select(t => t.WeekStart)
            .ToListAsync();
        var pendingWeeks = loggedWeeks.Count(w => !submittedWeeks.Contains(w));

        return new EmployeeDashboardDto(
            referenceDate, todayHours, 8, weekHours, 40, weekPct, billablePct, pendingWeeks);
    }

    public async Task<ManagerDashboardDto> GetManagerAsync()
    {
        var pending = await _db.Timesheets
            .Where(t => t.Status == TimesheetStatus.Submitted)
            .ToListAsync();

        var missing = await _team.GetMissingAsync();
        var utilization = await _team.GetUtilizationAsync();
        var avgUtil = utilization.Count == 0 ? 0 : (int)Math.Round(utilization.Average(u => u.UtilizationPercent));

        var atRisk = await _db.Projects
            .Where(p => !p.IsInternal)
            .CountAsync(p => RiskSet.Contains(p.Health));

        return new ManagerDashboardDto(
            pending.Count,
            pending.Sum(t => t.TotalHours),
            missing.Count,
            avgUtil,
            atRisk);
    }

    /// <summary>Monday of the week containing <paramref name="d"/>.</summary>
    private static DateOnly WeekMonday(DateOnly d)
    {
        var diff = ((int)d.DayOfWeek + 6) % 7; // Monday = 0
        return d.AddDays(-diff);
    }
}
