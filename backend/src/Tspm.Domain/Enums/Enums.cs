namespace Tspm.Domain.Enums;

public enum ProjectHealth
{
    OnTrack,
    AtRisk,
    OverBudget,
    Delayed,
    Completed,
}

public enum TimesheetStatus
{
    Draft,
    Submitted,
    Approved,
    Rejected,
}

public enum NotificationSeverity
{
    Info,
    Success,
    Warning,
    Danger,
}
