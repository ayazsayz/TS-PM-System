namespace Tspm.Application.Attendance;

/// <summary>Position captured by the browser at a check-in or check-out.</summary>
public record LocationPayload(
    double? Latitude,
    double? Longitude,
    double? AccuracyMeters,
    /// <summary>"Provided" | "Denied" | "Unavailable" (case-insensitive).</summary>
    string Status);

public record CheckInRequest(DateOnly LocalDate, LocationPayload Location);

public record CheckOutRequest(LocationPayload Location);

/// <summary>One check-in/out event as shown in the UI.</summary>
public record AttendanceEventDto(
    DateTime At,
    string Place,
    string LocationStatus,
    string? OfficeName,
    double? Latitude,
    double? Longitude,
    double? AccuracyMeters);

public record AttendanceSessionDto(
    Guid Id,
    DateOnly LocalDate,
    AttendanceEventDto CheckIn,
    AttendanceEventDto? CheckOut,
    bool IsOpen,
    /// <summary>Minutes elapsed; for an open session, up to now.</summary>
    int Minutes);

public record AttendanceDayDto(
    DateOnly LocalDate,
    IReadOnlyList<AttendanceSessionDto> Sessions,
    int TotalMinutes,
    bool IsCheckedIn,
    /// <summary>True when a session from an earlier day was never closed.</summary>
    bool HasMissingCheckOut);

/// <summary>A teammate's presence for the manager view.</summary>
public record TeamPresenceDto(
    Guid UserId,
    string Name,
    string Initials,
    string AvatarColor,
    string Status,
    string? Place,
    string? OfficeName,
    DateTime? SinceUtc,
    int TotalMinutes);

// ---- Offices ----

public record OfficeDto(
    Guid Id,
    string Name,
    double Latitude,
    double Longitude,
    int RadiusMeters,
    bool IsActive);

public record UpsertOfficeRequest(
    string Name,
    double Latitude,
    double Longitude,
    int RadiusMeters,
    bool IsActive);
