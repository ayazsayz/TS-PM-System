using Microsoft.EntityFrameworkCore;
using Tspm.Application.SuperAdmin;
using Tspm.Infrastructure.Persistence;

namespace Tspm.Infrastructure.Identity;

/// <summary>Cross-tenant audit log reader. Bypasses tenant query filters.</summary>
public class SuperAdminAuditService : ISuperAdminAuditService
{
    private readonly AppDbContext _db;

    public SuperAdminAuditService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<AuditLogDto>> QueryAsync(AuditLogQuery query)
    {
        var q = _db.AuditLog.IgnoreQueryFilters().AsNoTracking().AsQueryable();

        if (query.OrganizationId is Guid orgId) q = q.Where(a => a.OrganizationId == orgId);
        if (query.ActorId is Guid actorId) q = q.Where(a => a.ActorId == actorId);
        if (!string.IsNullOrWhiteSpace(query.Action)) q = q.Where(a => a.Action == query.Action);
        if (query.From is DateTime from) q = q.Where(a => a.Timestamp >= from);
        if (query.To is DateTime to) q = q.Where(a => a.Timestamp <= to);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim();
            q = q.Where(a => a.Message.Contains(s) || a.Action.Contains(s));
        }

        var take = query.Take is int t && t > 0 && t <= 500 ? t : 200;

        var rows = await (
            from a in q.OrderByDescending(a => a.Timestamp).Take(take)
            join u in _db.Users.IgnoreQueryFilters() on a.ActorId equals u.Id into ug
            from u in ug.DefaultIfEmpty()
            join o in _db.Organizations.IgnoreQueryFilters() on a.OrganizationId equals o.Id into og
            from o in og.DefaultIfEmpty()
            select new AuditLogDto(
                a.Id,
                a.Timestamp,
                a.ActorId,
                u == null ? "Unknown" : u.FullName,
                u == null ? "—" : (u.Email ?? "—"),
                a.OrganizationId,
                o == null ? "—" : o.Name,
                a.Action,
                a.Message,
                a.TargetType,
                a.TargetId))
            .ToListAsync();

        return rows;
    }

    public async Task<IReadOnlyList<string>> ListActionsAsync()
    {
        return await _db.AuditLog.IgnoreQueryFilters()
            .Select(a => a.Action)
            .Distinct()
            .OrderBy(a => a)
            .ToListAsync();
    }
}
