using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common.Interfaces;
using Tspm.Domain.Entities;

namespace Tspm.Application.TimeEntries;

public interface ITimeEntryService
{
    Task<IReadOnlyList<TimeEntryDto>> GetByDateAsync(Guid userId, DateOnly date);
    Task<IReadOnlyList<TimeEntryDto>> GetByWeekAsync(Guid userId, DateOnly weekStart);
    Task<TimeEntryDto> CreateAsync(Guid userId, UpsertTimeEntryRequest req);
    Task<TimeEntryDto?> UpdateAsync(Guid userId, Guid id, UpsertTimeEntryRequest req);
    Task<bool> DeleteAsync(Guid userId, Guid id);
    Task<int> DuplicateDayAsync(Guid userId, DuplicateDayRequest req);
}

public class TimeEntryService : ITimeEntryService
{
    private readonly IAppDbContext _db;

    public TimeEntryService(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<TimeEntryDto>> GetByDateAsync(Guid userId, DateOnly date)
    {
        var rows = await Query(userId).Where(e => e.Date == date).ToListAsync();
        return rows.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<TimeEntryDto>> GetByWeekAsync(Guid userId, DateOnly weekStart)
    {
        var weekEnd = weekStart.AddDays(6);
        var rows = await Query(userId)
            .Where(e => e.Date >= weekStart && e.Date <= weekEnd)
            .ToListAsync();
        return rows.Select(Map).ToList();
    }

    public async Task<TimeEntryDto> CreateAsync(Guid userId, UpsertTimeEntryRequest req)
    {
        var entry = new TimeEntry { UserId = userId };
        Apply(entry, req);
        _db.TimeEntries.Add(entry);
        await _db.SaveChangesAsync();
        return await ReloadAsync(entry.Id) ?? Map(entry);
    }

    public async Task<TimeEntryDto?> UpdateAsync(Guid userId, Guid id, UpsertTimeEntryRequest req)
    {
        var entry = await _db.TimeEntries.FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
        if (entry is null) return null;
        Apply(entry, req);
        await _db.SaveChangesAsync();
        return await ReloadAsync(id);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid id)
    {
        var entry = await _db.TimeEntries.FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
        if (entry is null) return false;
        _db.TimeEntries.Remove(entry);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<int> DuplicateDayAsync(Guid userId, DuplicateDayRequest req)
    {
        var source = await _db.TimeEntries
            .Where(e => e.UserId == userId && e.Date == req.FromDate)
            .ToListAsync();
        foreach (var e in source)
            _db.TimeEntries.Add(new TimeEntry
            {
                UserId = userId,
                ProjectId = e.ProjectId,
                Date = req.ToDate,
                Task = e.Task,
                Description = e.Description,
                StartTime = e.StartTime,
                EndTime = e.EndTime,
                BreakDuration = e.BreakDuration,
                IsBillable = e.IsBillable,
                Hours = e.Hours,
            });
        await _db.SaveChangesAsync();
        return source.Count;
    }

    private IQueryable<TimeEntry> Query(Guid userId) =>
        _db.TimeEntries.AsNoTracking().Include(e => e.Project).Where(e => e.UserId == userId);

    private static void Apply(TimeEntry e, UpsertTimeEntryRequest r)
    {
        e.ProjectId = r.ProjectId;
        e.Date = r.Date;
        e.Task = r.Task;
        e.Description = r.Description;
        e.StartTime = r.Start;
        e.EndTime = r.End;
        e.BreakDuration = r.Break;
        e.IsBillable = r.Billable;
        e.Hours = r.Hours;
    }

    private async Task<TimeEntryDto?> ReloadAsync(Guid id)
    {
        var e = await _db.TimeEntries.AsNoTracking().Include(x => x.Project).FirstOrDefaultAsync(x => x.Id == id);
        return e is null ? null : Map(e);
    }

    private static TimeEntryDto Map(TimeEntry e) => new(
        e.Id, e.ProjectId, e.Project?.Name ?? "", e.Project?.ColorHex ?? "#475467",
        e.Date, e.Task, e.Description, e.StartTime, e.EndTime, e.BreakDuration, e.IsBillable, e.Hours);
}
