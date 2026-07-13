using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common;
using Tspm.Application.Common.Interfaces;
using Tspm.Domain.Entities;
using Tspm.Domain.Enums;

namespace Tspm.Application.Approvals;

public interface IApprovalService
{
    Task<IReadOnlyList<ApprovalDto>> GetAsync(string? status);
    Task<ApprovalDto?> DecideAsync(Guid timesheetId, Guid approverId, bool approve, string? comment);
    Task<int> BulkApproveAsync(IReadOnlyList<Guid> ids, Guid approverId);
    Task<IReadOnlyList<ApprovalHistoryDto>> GetHistoryAsync();
}

public class ApprovalService : IApprovalService
{
    private readonly IAppDbContext _db;
    private readonly IUserDirectory _users;

    public ApprovalService(IAppDbContext db, IUserDirectory users)
    {
        _db = db;
        _users = users;
    }

    public async Task<IReadOnlyList<ApprovalDto>> GetAsync(string? status)
    {
        var query = _db.Timesheets.AsNoTracking().Where(t => t.Status != TimesheetStatus.Draft);
        if (string.Equals(status, "pending", StringComparison.OrdinalIgnoreCase))
            query = query.Where(t => t.Status == TimesheetStatus.Submitted);

        var sheets = await query.OrderByDescending(t => t.SubmittedAt).ToListAsync();
        var directory = await _users.GetManyAsync(sheets.Select(t => t.UserId));

        return sheets.Select(t => Map(t, directory)).ToList();
    }

    public async Task<ApprovalDto?> DecideAsync(Guid timesheetId, Guid approverId, bool approve, string? comment)
    {
        var sheet = await _db.Timesheets.FirstOrDefaultAsync(t => t.Id == timesheetId);
        if (sheet is null || sheet.Status != TimesheetStatus.Submitted) return null;

        sheet.Status = approve ? TimesheetStatus.Approved : TimesheetStatus.Rejected;
        sheet.ApproverId = approverId;
        sheet.DecidedAt = DateTime.UtcNow;
        sheet.DecisionComment = approve ? null : comment;

        var employee = await _users.GetAsync(sheet.UserId);
        var name = employee?.FullName ?? "employee";
        var week = Format.WeekRange(sheet.WeekStart);

        _db.AuditLog.Add(new AuditLogEntry
        {
            ActorId = approverId,
            Action = approve ? "timesheet.approved" : "timesheet.rejected",
            TargetType = nameof(Timesheet),
            TargetId = sheet.Id,
            Message = approve
                ? $"You approved {name}'s timesheet — {week} · {sheet.TotalHours:0.##}h"
                : $"You rejected {name}'s timesheet — {week}{(string.IsNullOrWhiteSpace(comment) ? "" : $" · \"{comment}\"")}",
        });

        _db.Notifications.Add(new Notification
        {
            UserId = sheet.UserId,
            Title = approve
                ? $"Your timesheet for {week} was approved"
                : $"Your timesheet for {week} was returned — please review",
            Category = "Timesheet",
            Severity = approve ? NotificationSeverity.Success : NotificationSeverity.Warning,
        });

        await _db.SaveChangesAsync();

        var directory = await _users.GetManyAsync([sheet.UserId]);
        return Map(sheet, directory);
    }

    public async Task<int> BulkApproveAsync(IReadOnlyList<Guid> ids, Guid approverId)
    {
        var count = 0;
        foreach (var id in ids)
            if (await DecideAsync(id, approverId, approve: true, comment: null) is not null)
                count++;
        return count;
    }

    public async Task<IReadOnlyList<ApprovalHistoryDto>> GetHistoryAsync()
    {
        var entries = await _db.AuditLog
            .AsNoTracking()
            .OrderByDescending(a => a.Timestamp)
            .Take(20)
            .ToListAsync();

        return entries
            .Select(a => new ApprovalHistoryDto(a.Action, a.Message, a.Timestamp.ToString("g")))
            .ToList();
    }

    private static ApprovalDto Map(Timesheet t, IReadOnlyDictionary<Guid, UserSummary> directory)
    {
        directory.TryGetValue(t.UserId, out var u);
        return new ApprovalDto(
            t.Id,
            t.UserId,
            u?.FullName ?? "Unknown",
            u?.Initials ?? "?",
            u?.Department ?? "",
            u?.AvatarColor ?? "#475467",
            Format.WeekRange(t.WeekStart),
            t.TotalHours,
            t.BillablePercent,
            DisplayNames.Status(t.Status),
            t.SubmittedAt is { } s ? Format.DayTime(s) : null,
            t.Flag,
            t.Status == TimesheetStatus.Submitted);
    }
}
