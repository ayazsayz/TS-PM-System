using Tspm.Domain.Common;
using Tspm.Domain.Enums;

namespace Tspm.Domain.Entities;

/// <summary>A topbar notification for a user.</summary>
public class Notification : Entity, IHasOrganization
{
    public Guid OrganizationId { get; set; }

    public Guid UserId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Body { get; set; }

    /// <summary>Category label shown in the meta line, e.g. "Approvals".</summary>
    public string? Category { get; set; }

    public NotificationSeverity Severity { get; set; } = NotificationSeverity.Info;
    public bool IsRead { get; set; }
}
