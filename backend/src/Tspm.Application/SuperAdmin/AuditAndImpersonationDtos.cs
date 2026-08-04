namespace Tspm.Application.SuperAdmin;

public record AuditLogDto(
    Guid Id,
    DateTime Timestamp,
    Guid ActorId,
    string ActorName,
    string ActorEmail,
    Guid OrganizationId,
    string OrganizationName,
    string Action,
    string Message,
    string? TargetType,
    Guid? TargetId);

public record AuditLogQuery(
    string? Search,
    Guid? OrganizationId,
    Guid? ActorId,
    string? Action,
    DateTime? From,
    DateTime? To,
    int? Take);

public record ImpersonationResponse(
    string AccessToken,
    DateTime AccessTokenExpiresAt,
    Guid UserId,
    string UserFullName,
    string UserEmail,
    Guid OrganizationId,
    string OrganizationName);
