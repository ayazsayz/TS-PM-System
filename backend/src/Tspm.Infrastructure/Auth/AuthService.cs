using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Tspm.Application.Auth;
using Tspm.Application.Common;
using Tspm.Application.Common.Interfaces;
using Tspm.Infrastructure.Identity;

namespace Tspm.Infrastructure.Auth;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly ITokenService _tokens;
    private readonly JwtSettings _settings;

    public AuthService(
        UserManager<ApplicationUser> users,
        ITokenService tokens,
        IOptions<JwtSettings> settings)
    {
        _users = users;
        _tokens = tokens;
        _settings = settings.Value;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _users.FindByEmailAsync(request.Email);
        if (user is null) return null;

        if (!user.IsActive)
            throw AppException.BadRequest("This account has been deactivated. Contact your administrator.");

        if (!await _users.CheckPasswordAsync(user, request.Password)) return null;

        user.LastLoginAt = DateTime.UtcNow;
        await _users.UpdateAsync(user);

        return await IssueAsync(user);
    }

    public async Task<AuthResponse?> RefreshAsync(RefreshRequest request)
    {
        var hash = _tokens.HashRefreshToken(request.RefreshToken);
        var user = _users.Users.FirstOrDefault(u => u.RefreshTokenHash == hash);
        if (user is null || !user.IsActive ||
            user.RefreshTokenExpiresAt is null || user.RefreshTokenExpiresAt < DateTime.UtcNow)
            return null;

        return await IssueAsync(user);
    }

    public async Task LogoutAsync(Guid userId)
    {
        var user = await _users.FindByIdAsync(userId.ToString());
        if (user is null) return;
        user.RefreshTokenHash = null;
        user.RefreshTokenExpiresAt = null;
        await _users.UpdateAsync(user);
    }

    public async Task<CurrentUserDto?> GetCurrentUserAsync(Guid userId)
    {
        var user = await _users.FindByIdAsync(userId.ToString());
        if (user is null) return null;
        return Map(user, await _users.GetRolesAsync(user));
    }

    /// <summary>
    /// Changes the password for both flows: the forced first-login change (user is on a
    /// one-time password) and a voluntary change. Clears the must-change flag and issues
    /// fresh, unrestricted tokens.
    /// </summary>
    public async Task<AuthResponse?> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await _users.FindByIdAsync(userId.ToString());
        if (user is null) return null;

        var result = await _users.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
            throw AppException.BadRequest(string.Join(" ", result.Errors.Select(e => e.Description)));

        user.MustChangePassword = false;
        await _users.UpdateAsync(user);

        return await IssueAsync(user);
    }

    private async Task<AuthResponse> IssueAsync(ApplicationUser user)
    {
        var roles = await _users.GetRolesAsync(user);
        var (accessToken, expiresAt) = _tokens.CreateAccessToken(
            user.Id, user.Email!, user.FullName, roles, user.MustChangePassword);

        var refreshToken = _tokens.CreateRefreshToken();
        user.RefreshTokenHash = _tokens.HashRefreshToken(refreshToken);
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(_settings.RefreshTokenDays);
        await _users.UpdateAsync(user);

        return new AuthResponse(accessToken, refreshToken, expiresAt, Map(user, roles), user.MustChangePassword);
    }

    private static CurrentUserDto Map(ApplicationUser u, IList<string> roles) =>
        new(u.Id, u.Email!, u.FullName, u.Initials, u.Title, u.Department, u.AvatarColor,
            roles.ToList(), u.MustChangePassword);
}
