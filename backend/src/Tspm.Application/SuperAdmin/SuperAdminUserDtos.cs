namespace Tspm.Application.SuperAdmin;

public record SuperAdminUserDto(
    Guid Id,
    string Email,
    string FullName,
    string Initials,
    string AvatarColor,
    Guid OrganizationId,
    string OrganizationName,
    string OrganizationSlug,
    IReadOnlyList<string> Roles,
    bool IsActive,
    bool MustChangePassword,
    string Status,
    DateTime? LastLoginAt,
    DateTime CreatedAt);

public record UpdateSuperAdminUserRolesRequest(IReadOnlyList<string> Roles);

public record SuperAdminResetPasswordResponse(string OneTimePassword);
