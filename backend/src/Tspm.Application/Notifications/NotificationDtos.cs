namespace Tspm.Application.Notifications;

public record NotificationDto(
    Guid Id,
    string Title,
    string? Body,
    string? Category,
    string Severity,
    bool IsRead,
    string Ago);

public record NotificationListDto(int Unread, IReadOnlyList<NotificationDto> Items);
