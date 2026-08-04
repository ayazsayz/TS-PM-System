using Tspm.Application.Common.Interfaces;
using Tspm.Domain.Entities;

namespace Tspm.Infrastructure.Persistence;

public class AuditLogger : IAuditLogger
{
    private readonly IAppDbContext _db;

    public AuditLogger(IAppDbContext db) => _db = db;

    public void Log(Guid actorId, Guid organizationId, string action, string message, string? targetType = null, Guid? targetId = null)
    {
        _db.AuditLog.Add(new AuditLogEntry
        {
            OrganizationId = organizationId,
            ActorId = actorId,
            Action = action,
            TargetType = targetType,
            TargetId = targetId,
            Message = message,
            Timestamp = DateTime.UtcNow,
        });
    }
}
