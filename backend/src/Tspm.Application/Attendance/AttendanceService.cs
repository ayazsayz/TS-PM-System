using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common;
using Tspm.Application.Common.Interfaces;
using Tspm.Domain.Entities;
using Tspm.Domain.Enums;

namespace Tspm.Application.Attendance;

public interface IAttendanceService
{
    Task<AttendanceDayDto> GetTodayAsync(Guid userId, DateOnly localDate);
    Task<AttendanceDayDto> CheckInAsync(Guid userId, CheckInRequest request);
    Task<AttendanceDayDto> CheckOutAsync(Guid userId, CheckOutRequest request);
    Task<IReadOnlyList<AttendanceSessionDto>> GetHistoryAsync(Guid userId, DateOnly from, DateOnly to);
    Task<IReadOnlyList<TeamPresenceDto>> GetTeamPresenceAsync(DateOnly localDate);
}

public class AttendanceService : IAttendanceService
{
    private readonly IAppDbContext _db;
    private readonly IUserDirectory _users;

    public AttendanceService(IAppDbContext db, IUserDirectory users)
    {
        _db = db;
        _users = users;
    }

    public async Task<AttendanceDayDto> GetTodayAsync(Guid userId, DateOnly localDate)
    {
        var sessions = await SessionsForDayAsync(userId, localDate);
        var openElsewhere = await _db.AttendanceSessions
            .AsNoTracking()
            .AnyAsync(s => s.UserId == userId && s.CheckOutAt == null && s.LocalDate < localDate);

        return BuildDay(localDate, sessions, await OfficeNamesAsync(), openElsewhere);
    }

    public async Task<AttendanceDayDto> CheckInAsync(Guid userId, CheckInRequest request)
    {
        var open = await _db.AttendanceSessions.FirstOrDefaultAsync(s => s.UserId == userId && s.CheckOutAt == null);
        if (open is not null)
            throw AppException.BadRequest("You're already checked in — check out before checking in again.");

        var (status, place, officeId) = await ResolveLocationAsync(request.Location);

        var session = new AttendanceSession
        {
            UserId = userId,
            LocalDate = request.LocalDate,
            CheckInAt = DateTime.UtcNow,
            CheckInLatitude = request.Location.Latitude,
            CheckInLongitude = request.Location.Longitude,
            CheckInAccuracyMeters = request.Location.AccuracyMeters,
            CheckInLocationStatus = status,
            CheckInPlace = place,
            CheckInOfficeId = officeId,
        };
        _db.AttendanceSessions.Add(session);
        await _db.SaveChangesAsync();

        return await GetTodayAsync(userId, request.LocalDate);
    }

    public async Task<AttendanceDayDto> CheckOutAsync(Guid userId, CheckOutRequest request)
    {
        var open = await _db.AttendanceSessions.FirstOrDefaultAsync(s => s.UserId == userId && s.CheckOutAt == null);
        if (open is null)
            throw AppException.BadRequest("You're not checked in.");

        var (status, place, officeId) = await ResolveLocationAsync(request.Location);

        open.CheckOutAt = DateTime.UtcNow;
        open.CheckOutLatitude = request.Location.Latitude;
        open.CheckOutLongitude = request.Location.Longitude;
        open.CheckOutAccuracyMeters = request.Location.AccuracyMeters;
        open.CheckOutLocationStatus = status;
        open.CheckOutPlace = place;
        open.CheckOutOfficeId = officeId;
        await _db.SaveChangesAsync();

        return await GetTodayAsync(userId, open.LocalDate);
    }

    public async Task<IReadOnlyList<AttendanceSessionDto>> GetHistoryAsync(Guid userId, DateOnly from, DateOnly to)
    {
        var sessions = await _db.AttendanceSessions
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.LocalDate >= from && s.LocalDate <= to)
            .OrderByDescending(s => s.CheckInAt)
            .ToListAsync();

        var offices = await OfficeNamesAsync();
        return sessions.Select(s => MapSession(s, offices)).ToList();
    }

    public async Task<IReadOnlyList<TeamPresenceDto>> GetTeamPresenceAsync(DateOnly localDate)
    {
        var people = await _users.GetAllAsync();
        var sessions = await _db.AttendanceSessions
            .AsNoTracking()
            .Where(s => s.LocalDate == localDate)
            .ToListAsync();
        var offices = await OfficeNamesAsync();

        return people
            .Select(p =>
            {
                var mine = sessions.Where(s => s.UserId == p.Id).ToList();
                var open = mine.FirstOrDefault(s => s.CheckOutAt is null);
                var minutes = mine.Sum(s => ElapsedMinutes(s));

                var status = open is not null ? "Checked in"
                    : mine.Count > 0 ? "Checked out"
                    : "Not checked in";

                return new TeamPresenceDto(
                    p.Id, p.FullName, p.Initials, p.AvatarColor,
                    status,
                    open is not null ? open.CheckInPlace.ToString() : null,
                    open?.CheckInOfficeId is { } id && offices.TryGetValue(id, out var name) ? name : null,
                    open?.CheckInAt,
                    minutes);
            })
            .OrderByDescending(t => t.Status == "Checked in")
            .ThenByDescending(t => t.TotalMinutes)
            .ToList();
    }

    // ---- helpers ----

    private async Task<List<AttendanceSession>> SessionsForDayAsync(Guid userId, DateOnly localDate) =>
        await _db.AttendanceSessions
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.LocalDate == localDate)
            .OrderBy(s => s.CheckInAt)
            .ToListAsync();

    private async Task<Dictionary<Guid, string>> OfficeNamesAsync() =>
        await _db.Offices.AsNoTracking().ToDictionaryAsync(o => o.Id, o => o.Name);

    /// <summary>
    /// Decides where an event happened. The label is always computed here from the
    /// coordinates and the org's geofences — never taken from the client.
    /// </summary>
    private async Task<(LocationStatus Status, Place Place, Guid? OfficeId)> ResolveLocationAsync(
        LocationPayload location)
    {
        var status = ParseStatus(location.Status);

        if (status != LocationStatus.Provided || location.Latitude is not { } lat || location.Longitude is not { } lng)
            return (status, Place.Unknown, null);

        var offices = await _db.Offices.AsNoTracking().Where(o => o.IsActive).ToListAsync();

        // Nearest office that the point falls inside.
        var match = offices
            .Select(o => new { Office = o, Distance = GeoDistance.MetersBetween(lat, lng, o.Latitude, o.Longitude) })
            .Where(x => x.Distance <= x.Office.RadiusMeters)
            .OrderBy(x => x.Distance)
            .FirstOrDefault();

        return match is not null
            ? (status, Place.InOffice, match.Office.Id)
            : (status, Place.OffSite, null);
    }

    private static LocationStatus ParseStatus(string? value) =>
        Enum.TryParse<LocationStatus>(value, ignoreCase: true, out var s) ? s : LocationStatus.Unavailable;

    private static int ElapsedMinutes(AttendanceSession s) =>
        (int)Math.Round(((s.CheckOutAt ?? DateTime.UtcNow) - s.CheckInAt).TotalMinutes);

    private static AttendanceDayDto BuildDay(
        DateOnly localDate,
        List<AttendanceSession> sessions,
        Dictionary<Guid, string> offices,
        bool hasMissingCheckOut) =>
        new(
            localDate,
            sessions.Select(s => MapSession(s, offices)).ToList(),
            sessions.Sum(ElapsedMinutes),
            sessions.Any(s => s.CheckOutAt is null),
            hasMissingCheckOut);

    private static AttendanceSessionDto MapSession(AttendanceSession s, Dictionary<Guid, string> offices)
    {
        string? OfficeName(Guid? id) => id is { } v && offices.TryGetValue(v, out var n) ? n : null;

        var checkIn = new AttendanceEventDto(
            s.CheckInAt, s.CheckInPlace.ToString(), s.CheckInLocationStatus.ToString(),
            OfficeName(s.CheckInOfficeId), s.CheckInLatitude, s.CheckInLongitude, s.CheckInAccuracyMeters);

        var checkOut = s.CheckOutAt is { } outAt
            ? new AttendanceEventDto(
                outAt, (s.CheckOutPlace ?? Place.Unknown).ToString(),
                (s.CheckOutLocationStatus ?? LocationStatus.Unavailable).ToString(),
                OfficeName(s.CheckOutOfficeId), s.CheckOutLatitude, s.CheckOutLongitude, s.CheckOutAccuracyMeters)
            : null;

        return new AttendanceSessionDto(s.Id, s.LocalDate, checkIn, checkOut, s.CheckOutAt is null, ElapsedMinutes(s));
    }
}
