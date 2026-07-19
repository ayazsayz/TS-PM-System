using Tspm.Domain.Common;
using Tspm.Domain.Enums;

namespace Tspm.Domain.Entities;

/// <summary>
/// One check-in/check-out pair. A user may have several per day; the day's presence
/// is the sum of its completed sessions. A session with no <see cref="CheckOutAt"/>
/// is still open (the user is currently checked in).
/// </summary>
public class AttendanceSession : Entity, IHasOrganization
{
    public Guid OrganizationId { get; set; }
    public Guid UserId { get; set; }

    /// <summary>
    /// The user's local calendar day, supplied by the client. Timestamps are UTC, so
    /// this is what groups sessions into "days" without the server guessing a timezone.
    /// </summary>
    public DateOnly LocalDate { get; set; }

    // ---- Check in ----
    public DateTime CheckInAt { get; set; }
    public double? CheckInLatitude { get; set; }
    public double? CheckInLongitude { get; set; }
    public double? CheckInAccuracyMeters { get; set; }
    public LocationStatus CheckInLocationStatus { get; set; } = LocationStatus.Unavailable;
    public Guid? CheckInOfficeId { get; set; }
    public Place CheckInPlace { get; set; } = Place.Unknown;

    // ---- Check out (null while the session is open) ----
    public DateTime? CheckOutAt { get; set; }
    public double? CheckOutLatitude { get; set; }
    public double? CheckOutLongitude { get; set; }
    public double? CheckOutAccuracyMeters { get; set; }
    public LocationStatus? CheckOutLocationStatus { get; set; }
    public Guid? CheckOutOfficeId { get; set; }
    public Place? CheckOutPlace { get; set; }

    public bool IsOpen => CheckOutAt is null;

    /// <summary>Elapsed time for a completed session; null while still open.</summary>
    public TimeSpan? Duration => CheckOutAt is { } end ? end - CheckInAt : null;
}
