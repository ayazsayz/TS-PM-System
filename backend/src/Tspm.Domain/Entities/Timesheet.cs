using Tspm.Domain.Common;
using Tspm.Domain.Enums;

namespace Tspm.Domain.Entities;

/// <summary>A weekly submission wrapping the week's time entries for one user.</summary>
public class Timesheet : Entity, IHasOrganization
{
    public Guid OrganizationId { get; set; }

    public Guid UserId { get; set; }

    public DateOnly WeekStart { get; set; }

    public TimesheetStatus Status { get; set; } = TimesheetStatus.Draft;

    /// <summary>
    /// Snapshots shown on the approvals list. Captured at submission time
    /// (real systems freeze these when the week is submitted).
    /// </summary>
    public decimal TotalHours { get; set; }
    public int BillablePercent { get; set; }

    /// <summary>Optional flag note, e.g. "+2h overtime", "5h missing".</summary>
    public string? Flag { get; set; }

    public DateTime? SubmittedAt { get; set; }

    // Approval decision
    public Guid? ApproverId { get; set; }
    public DateTime? DecidedAt { get; set; }
    public string? DecisionComment { get; set; }
}
