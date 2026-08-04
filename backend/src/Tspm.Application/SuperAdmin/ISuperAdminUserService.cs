namespace Tspm.Application.SuperAdmin;

/// <summary>Platform-wide (cross-tenant) user management. SuperAdmin only.</summary>
public interface ISuperAdminUserService
{
    Task<IReadOnlyList<SuperAdminUserDto>> ListAsync(string? search, Guid? organizationId, string? role, string? status);
    Task<SuperAdminUserDto?> GetAsync(Guid id);
    Task<SuperAdminUserDto?> SetActiveAsync(Guid id, bool isActive, Guid actingUserId);
    Task<SuperAdminUserDto?> SetRolesAsync(Guid id, IReadOnlyList<string> roles, Guid actingUserId);
    Task<string?> ResetPasswordAsync(Guid id, Guid actingUserId);
}
