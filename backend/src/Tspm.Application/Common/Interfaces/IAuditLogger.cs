namespace Tspm.Application.Common.Interfaces;

/// <summary>Records an audit entry attributed to a specific actor. Not tenant-scoped: the caller must supply the target org.</summary>
public interface IAuditLogger
{
    void Log(Guid actorId, Guid organizationId, string action, string message, string? targetType = null, Guid? targetId = null);
}
