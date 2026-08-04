namespace Tspm.Application.SuperAdmin;

public interface ISuperAdminAuditService
{
    Task<IReadOnlyList<AuditLogDto>> QueryAsync(AuditLogQuery query);
    Task<IReadOnlyList<string>> ListActionsAsync();
}
