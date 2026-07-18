using Tspm.Domain.Common;

namespace Tspm.Domain.Entities;

/// <summary>
/// A single logged time entry. Powers both the daily grid and the weekly grid
/// (the weekly view groups entries by project within a week).
/// </summary>
public class TimeEntry : Entity, IHasOrganization
{
    public Guid OrganizationId { get; set; }

    public Guid UserId { get; set; }

    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public DateOnly Date { get; set; }

    public string Task { get; set; } = string.Empty;
    public string? Description { get; set; }

    // Times are kept as free-form strings ("09:00", "0:30") to match the UI.
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string? BreakDuration { get; set; }

    public bool IsBillable { get; set; } = true;
    public decimal Hours { get; set; }
}
