using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common;
using Tspm.Application.Common.Interfaces;
using Tspm.Domain.Entities;

namespace Tspm.Application.Attendance;

public interface IOfficeService
{
    Task<IReadOnlyList<OfficeDto>> ListAsync();
    Task<OfficeDto?> GetAsync(Guid id);
    Task<OfficeDto> CreateAsync(UpsertOfficeRequest request);
    Task<OfficeDto?> UpdateAsync(Guid id, UpsertOfficeRequest request);
    Task<bool> DeleteAsync(Guid id);
}

public class OfficeService : IOfficeService
{
    private readonly IAppDbContext _db;

    public OfficeService(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<OfficeDto>> ListAsync() =>
        await _db.Offices.AsNoTracking().OrderBy(o => o.Name).Select(o => Map(o)).ToListAsync();

    public async Task<OfficeDto?> GetAsync(Guid id) =>
        await _db.Offices.AsNoTracking().Where(o => o.Id == id).Select(o => Map(o)).FirstOrDefaultAsync();

    public async Task<OfficeDto> CreateAsync(UpsertOfficeRequest request)
    {
        var name = request.Name.Trim();
        if (await _db.Offices.AnyAsync(o => o.Name == name))
            throw AppException.Conflict($"An office named '{name}' already exists.");

        var office = new Office();
        Apply(office, request);
        _db.Offices.Add(office);
        await _db.SaveChangesAsync();
        return Map(office);
    }

    public async Task<OfficeDto?> UpdateAsync(Guid id, UpsertOfficeRequest request)
    {
        var office = await _db.Offices.FirstOrDefaultAsync(o => o.Id == id);
        if (office is null) return null;

        var name = request.Name.Trim();
        if (await _db.Offices.AnyAsync(o => o.Name == name && o.Id != id))
            throw AppException.Conflict($"An office named '{name}' already exists.");

        Apply(office, request);
        await _db.SaveChangesAsync();
        return Map(office);
    }

    /// <summary>Deletion is blocked once attendance references the office — deactivate instead.</summary>
    public async Task<bool> DeleteAsync(Guid id)
    {
        var office = await _db.Offices.FirstOrDefaultAsync(o => o.Id == id);
        if (office is null) return false;

        var referenced = await _db.AttendanceSessions
            .AnyAsync(s => s.CheckInOfficeId == id || s.CheckOutOfficeId == id);
        if (referenced)
            throw AppException.BadRequest(
                "Attendance has been recorded at this office. Deactivate it instead of deleting.");

        _db.Offices.Remove(office);
        await _db.SaveChangesAsync();
        return true;
    }

    private static void Apply(Office o, UpsertOfficeRequest r)
    {
        o.Name = r.Name.Trim();
        o.Latitude = r.Latitude;
        o.Longitude = r.Longitude;
        o.RadiusMeters = r.RadiusMeters;
        o.IsActive = r.IsActive;
    }

    private static OfficeDto Map(Office o) =>
        new(o.Id, o.Name, o.Latitude, o.Longitude, o.RadiusMeters, o.IsActive);
}
