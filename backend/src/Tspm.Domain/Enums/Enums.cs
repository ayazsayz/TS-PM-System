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

/// <summary>Whether the browser supplied a position for an attendance event.</summary>
public enum LocationStatus
{
    /// <summary>Coordinates were captured.</summary>
    Provided,
    /// <summary>The user declined the location permission.</summary>
    Denied,
    /// <summary>Permission granted but no fix was obtained (timeout/hardware).</summary>
    Unavailable,
}

/// <summary>
/// Where an attendance event happened, derived server-side by matching the
/// captured coordinates against the organization's office geofences.
/// </summary>
public enum Place
{
    /// <summary>No usable coordinates, so location is unknown.</summary>
    Unknown,
    /// <summary>Inside an office's radius.</summary>
    InOffice,
    /// <summary>Located, but outside every office radius.</summary>
    OffSite,
}
