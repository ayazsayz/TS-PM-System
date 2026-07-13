using Tspm.Application.Admin;

namespace Tspm.Application.Common.Interfaces;

public interface IUserAdminService
{
    Task<IReadOnlyList<AdminUserDto>> ListAsync(string? search, string? role, string? status);
    Task<AdminUserDto?> GetAsync(Guid id);

    /// <summary>Creates the user with a generated one-time password (returned once).</summary>
    Task<CreateUserResponse> CreateAsync(CreateUserRequest request);

    Task<AdminUserDto?> UpdateAsync(Guid id, UpdateUserRequest request);

    /// <param name="actingUserId">Used to prevent self-demotion / removing the last admin.</param>
    Task<AdminUserDto?> SetRolesAsync(Guid id, IReadOnlyList<string> roles, Guid actingUserId);

    Task<AdminUserDto?> SetActiveAsync(Guid id, bool isActive, Guid actingUserId);

    /// <summary>Issues a fresh one-time password and forces a change on next login.</summary>
    Task<string?> ResetPasswordAsync(Guid id);
}
