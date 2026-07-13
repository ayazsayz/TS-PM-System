using Microsoft.AspNetCore.Mvc;
using Tspm.Application.Notifications;

namespace Tspm.Api.Controllers;

[Route("api/notifications")]
public class NotificationsController : ApiControllerBase
{
    private readonly INotificationService _notifications;

    public NotificationsController(INotificationService notifications) => _notifications = notifications;

    [HttpGet]
    public async Task<ActionResult<NotificationListDto>> Get()
        => Ok(await _notifications.GetForUserAsync(UserId));

    [HttpPost("mark-all-read")]
    public async Task<IActionResult> MarkAllRead()
    {
        await _notifications.MarkAllReadAsync(UserId);
        return NoContent();
    }
}
