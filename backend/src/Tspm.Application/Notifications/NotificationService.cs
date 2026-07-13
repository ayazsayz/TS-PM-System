using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common;
using Tspm.Application.Common.Interfaces;

namespace Tspm.Application.Notifications;

public interface INotificationService
{
    Task<NotificationListDto> GetForUserAsync(Guid userId);
    Task MarkAllReadAsync(Guid userId);
}

public class NotificationService : INotificationService
{
    private readonly IAppDbContext _db;

    public NotificationService(IAppDbContext db) => _db = db;

    public async Task<NotificationListDto> GetForUserAsync(Guid userId)
    {
        var items = await _db.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(30)
            .ToListAsync();

        var dtos = items
            .Select(n => new NotificationDto(
                n.Id, n.Title, n.Body, n.Category,
                DisplayNames.Severity(n.Severity), n.IsRead, Format.Ago(n.CreatedAt)))
            .ToList();

        return new NotificationListDto(items.Count(n => !n.IsRead), dtos);
    }

    public async Task MarkAllReadAsync(Guid userId)
    {
        await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }
}
