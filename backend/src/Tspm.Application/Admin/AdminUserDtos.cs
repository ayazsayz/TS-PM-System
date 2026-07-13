namespace Tspm.Application.Admin;

public record AdminUserDto(
    Guid Id,
    string Email,
    string FullName,
    string Initials,
    string? Title,
    string? Department,
    string AvatarColor,
    IReadOnlyList<string> Roles,
    bool IsActive,
    bool MustChangePassword,
    /// <summary>Derived: "Active" | "Invited" (still on a one-time password) | "Inactive".</summary>
    string Status,
    DateTime? LastLoginAt,
    DateTime CreatedAt);

public record CreateUserRequest(
    string Email,
    string FullName,
    string? Title,
    string? Department,
    string? AvatarColor,
    IReadOnlyList<string> Roles);

/// <summary>The one-time password is returned exactly once, at creation.</summary>
public record CreateUserResponse(AdminUserDto User, string OneTimePassword);

public record UpdateUserRequest(
    string FullName,
    string? Title,
    string? Department,
    string? AvatarColor);

public record SetRolesRequest(IReadOnlyList<string> Roles);

public record SetStatusRequest(bool IsActive);

public record OneTimePasswordResponse(string OneTimePassword);
