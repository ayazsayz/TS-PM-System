using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common;
using Tspm.Application.Common.Interfaces;
using Tspm.Domain.Entities;
using Tspm.Domain.Enums;

namespace Tspm.Application.Timesheets;

public interface ITimesheetService
{
    Task<WeeklyTimesheetDto> GetWeekAsync(Guid userId, DateOnly weekStart);
    Task<WeeklyTimesheetDto> SubmitAsync(Guid userId, DateOnly weekStart);

    /// <summary>Upserts one cell of the weekly grid and returns the recomputed week.</summary>
    Task<WeeklyTimesheetDto> SetCellAsync(Guid userId, DateOnly weekStart, SetCellRequest request);
}

public class TimesheetService : ITimesheetService
{
    private const decimal WeekHours = 40m;
    private readonly IAppDbContext _db;

    public TimesheetService(IAppDbContext db) => _db = db;

    public async Task<WeeklyTimesheetDto> GetWeekAsync(Guid userId, DateOnly weekStart)
    {
        var status = await _db.Timesheets
            .AsNoTracking()
            .Where(t => t.UserId == userId && t.WeekStart == weekStart)
            .Select(t => (TimesheetStatus?)t.Status)
            .FirstOrDefaultAsync() ?? TimesheetStatus.Draft;

        return await BuildAsync(userId, weekStart, status);
    }

    public async Task<WeeklyTimesheetDto> SubmitAsync(Guid userId, DateOnly weekStart)
    {
        var built = await BuildAsync(userId, weekStart, TimesheetStatus.Submitted);

        var sheet = await _db.Timesheets
            .FirstOrDefaultAsync(t => t.UserId == userId && t.WeekStart == weekStart);
        if (sheet is null)
        {
            sheet = new Timesheet { UserId = userId, WeekStart = weekStart };
            _db.Timesheets.Add(sheet);
        }
        sheet.Status = TimesheetStatus.Submitted;
        sheet.SubmittedAt = DateTime.UtcNow;
        sheet.TotalHours = built.TotalHours;
        sheet.BillablePercent = built.BillablePercent;
        await _db.SaveChangesAsync();

        return built;
    }

    /// <summary>
    /// Upserts the hours for a single project+task+day. The weekly grid is an aggregate,
    /// so a cell may map to several underlying entries: we keep one and drop the rest.
    /// Setting hours to zero clears the cell entirely.
    /// </summary>
    public async Task<WeeklyTimesheetDto> SetCellAsync(
        Guid userId, DateOnly weekStart, SetCellRequest request)
    {
        var task = request.Task ?? string.Empty;

        var existing = await _db.TimeEntries
            .Where(e => e.UserId == userId
                        && e.ProjectId == request.ProjectId
                        && e.Date == request.Date
                        && e.Task == task)
            .ToListAsync();

        if (request.Hours <= 0)
        {
            _db.TimeEntries.RemoveRange(existing);
        }
        else if (existing.Count == 0)
        {
            _db.TimeEntries.Add(new TimeEntry
            {
                UserId = userId,
                ProjectId = request.ProjectId,
                Date = request.Date,
                Task = task,
                IsBillable = true,
                Hours = request.Hours,
            });
        }
        else
        {
            existing[0].Hours = request.Hours;
            // Collapse duplicates so the cell stays a single source of truth.
            if (existing.Count > 1) _db.TimeEntries.RemoveRange(existing.Skip(1));
        }

        await _db.SaveChangesAsync();
        return await GetWeekAsync(userId, weekStart);
    }

    private async Task<WeeklyTimesheetDto> BuildAsync(Guid userId, DateOnly weekStart, TimesheetStatus status)
    {
        var weekEnd = weekStart.AddDays(6);
        var entries = await _db.TimeEntries
            .AsNoTracking()
            .Include(e => e.Project).ThenInclude(p => p.Client)
            .Where(e => e.UserId == userId && e.Date >= weekStart && e.Date <= weekEnd)
            .ToListAsync();

        var rows = entries
            .GroupBy(e => new { e.ProjectId, e.Task })
            .Select(g =>
            {
                var cells = new decimal[7];
                foreach (var e in g)
                {
                    var day = (e.Date.DayNumber - weekStart.DayNumber);
                    if (day is >= 0 and < 7) cells[day] += e.Hours;
                }
                var first = g.First().Project;
                return new WeekRowDto(
                    g.Key.ProjectId,
                    first.Name,
                    first.Client.Name,
                    first.ColorHex,
                    g.Key.Task,
                    cells,
                    cells.Sum());
            })
            .OrderBy(r => r.ProjectName)
            .ToList();

        var dayTotals = new decimal[7];
        foreach (var r in rows)
            for (var d = 0; d < 7; d++) dayTotals[d] += r.Cells[d];

        var total = dayTotals.Sum();
        var billableHours = entries.Where(e => e.IsBillable).Sum(e => e.Hours);
        var billablePct = total == 0 ? 0 : (int)Math.Round(billableHours / total * 100);
        var weekPct = (int)Math.Round(Math.Min(100m, total / WeekHours * 100));

        return new WeeklyTimesheetDto(
            weekStart,
            DisplayNames.Status(status),
            total,
            weekPct,
            Math.Max(0, WeekHours - total),
            billablePct,
            dayTotals,
            rows);
    }
}
