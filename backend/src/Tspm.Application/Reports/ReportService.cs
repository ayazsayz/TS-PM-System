using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common.Interfaces;
using Tspm.Application.Team;

namespace Tspm.Application.Reports;

public interface IReportService
{
    Task<ReportsSummaryDto> GetSummaryAsync();
}

/// <summary>
/// Aggregates derived from real project + time-entry data. (Revenue/cost/margin
/// require billing-rate configuration and are intentionally left for a future
/// finance module; budget/spend and hours are reported here.)
/// </summary>
public class ReportService : IReportService
{
    private readonly IAppDbContext _db;
    private readonly ITeamService _team;

    public ReportService(IAppDbContext db, ITeamService team)
    {
        _db = db;
        _team = team;
    }

    public async Task<ReportsSummaryDto> GetSummaryAsync()
    {
        var projects = await _db.Projects
            .AsNoTracking()
            .Include(p => p.Client)
            .Where(p => !p.IsInternal && !p.IsArchived)
            .ToListAsync();

        // Actual hours (and therefore spend) come from real logged time.
        var hoursByProject = await _db.TimeEntries
            .AsNoTracking()
            .GroupBy(e => e.ProjectId)
            .Select(g => new { g.Key, Hours = g.Sum(e => e.Hours) })
            .ToDictionaryAsync(x => x.Key, x => x.Hours);

        decimal ActualOf(Guid projectId) =>
            hoursByProject.TryGetValue(projectId, out var h) ? h : 0m;

        var totalBudget = projects.Sum(p => p.Budget);
        var totalSpent = projects.Sum(p => ActualOf(p.Id) * p.HourlyRate);
        var budgetUsedPct = totalBudget == 0 ? 0 : (int)Math.Round(totalSpent / totalBudget * 100);

        var estVsActual = projects
            .OrderByDescending(p => ActualOf(p.Id))
            .Select(p =>
            {
                var actual = ActualOf(p.Id);
                return new EstVsActualDto(
                    p.Name,
                    p.EstimatedHours,
                    (int)Math.Round(actual),
                    p.EstimatedHours == 0 ? 0 : (int)Math.Round(actual / p.EstimatedHours * 100));
            })
            .ToList();

        var clientBilling = projects
            .GroupBy(p => p.Client.Name)
            .Select(g => new ClientBillingDto(
                g.Key,
                (int)Math.Round(g.Sum(p => ActualOf(p.Id))),
                g.Sum(p => ActualOf(p.Id) * p.HourlyRate),
                g.Count()))
            .OrderByDescending(c => c.Spend)
            .ToList();

        var entries = await _db.TimeEntries.AsNoTracking().ToListAsync();
        var billable = entries.Where(e => e.IsBillable).Sum(e => e.Hours);
        var nonBillable = entries.Where(e => !e.IsBillable).Sum(e => e.Hours);
        var totalEntryHours = billable + nonBillable;
        var billablePct = totalEntryHours == 0 ? 0 : (int)Math.Round(billable / totalEntryHours * 100);

        var utilization = await _team.GetUtilizationAsync();
        var avgUtil = utilization.Count == 0 ? 0 : (int)Math.Round(utilization.Average(u => u.UtilizationPercent));

        return new ReportsSummaryDto(
            totalBudget,
            totalSpent,
            budgetUsedPct,
            projects.Sum(p => p.EstimatedHours),
            (int)Math.Round(projects.Sum(p => ActualOf(p.Id))),
            avgUtil,
            new BillableSplitDto(billable, nonBillable, billablePct),
            estVsActual,
            clientBilling);
    }
}
