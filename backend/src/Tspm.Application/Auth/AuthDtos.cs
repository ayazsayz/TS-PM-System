namespace Tspm.Application.Auth;

public record LoginRequest(string Email, string Password);

public record RefreshRequest(string RefreshToken);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAt,
    CurrentUserDto User,
    /// <summary>When true the token is restricted to the change-password endpoint.</summary>
    bool MustChangePassword);

public record CurrentUserDto(
    Guid Id,
    string Email,
    string FullName,
    string Initials,
    string? Title,
    string? Department,
    string AvatarColor,
    IReadOnlyList<string> Roles,
    bool MustChangePassword);
