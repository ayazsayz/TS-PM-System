using Tspm.Domain.Enums;

namespace Tspm.Application.Common;

/// <summary>Enum → UI label mapping matching the frontend copy.</summary>
public static class DisplayNames
{
    public static string Health(ProjectHealth h) => h switch
    {
        ProjectHealth.OnTrack => "On track",
        ProjectHealth.AtRisk => "At risk",
        ProjectHealth.OverBudget => "Over budget",
        ProjectHealth.Delayed => "Delayed",
        ProjectHealth.Completed => "Completed",
        _ => h.ToString(),
    };

    /// <summary>Submitted surfaces as "Pending" in the UI.</summary>
    public static string Status(TimesheetStatus s) => s switch
    {
        TimesheetStatus.Draft => "Draft",
        TimesheetStatus.Submitted => "Pending",
        TimesheetStatus.Approved => "Approved",
        TimesheetStatus.Rejected => "Rejected",
        _ => s.ToString(),
    };

    public static string Severity(NotificationSeverity s) => s switch
    {
        NotificationSeverity.Info => "info",
        NotificationSeverity.Success => "success",
        NotificationSeverity.Warning => "warning",
        NotificationSeverity.Danger => "danger",
        _ => "info",
    };
}
