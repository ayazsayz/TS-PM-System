namespace Tspm.Application.Auth;

public record LoginRequest(string Email, string Password);

public record RefreshRequest(string RefreshToken);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAt,
    CurrentUserDto User);

public record CurrentUserDto(
    Guid Id,
    string Email,
    string FullName,
    string Initials,
    string? Title,
    string? Department,
    string AvatarColor,
    IReadOnlyList<string> Roles);
