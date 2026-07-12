using Tspm.Domain.Common;

namespace Tspm.Domain.Entities;

/// <summary>Approval history / audit trail entry.</summary>
public class AuditLogEntry : Entity
{
    public Guid ActorId { get; set; }

    /// <summary>Machine action code, e.g. "timesheet.approved".</summary>
    public string Action { get; set; } = string.Empty;

    public string? TargetType { get; set; }
    public Guid? TargetId { get; set; }

    /// <summary>Human-readable message rendered in the timeline.</summary>
    public string Message { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
