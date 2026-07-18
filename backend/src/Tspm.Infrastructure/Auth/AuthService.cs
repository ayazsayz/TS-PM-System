using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Tspm.Application.Auth;
using Tspm.Application.Common;
using Tspm.Application.Common.Interfaces;
using Tspm.Domain.Common;
using Tspm.Domain.Entities;
using Tspm.Infrastructure.Identity;

namespace Tspm.Infrastructure.Auth;

public partial class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly IAppDbContext _db;
    private readonly ITokenService _tokens;
    private readonly JwtSettings _settings;

    public AuthService(
        UserManager<ApplicationUser> users,
        IAppDbContext db,
        ITokenService tokens,
        IOptions<JwtSettings> settings)
    {
        _users = users;
        _db = db;
        _tokens = tokens;
        _settings = settings.Value;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var email = request.Email.Trim();
        var orgName = request.OrganizationName.Trim();

        if (await _users.FindByEmailAsync(email) is not null)
            throw AppException.Conflict($"An account with the email '{email}' already exists.");

        if (await _db.Organizations.AnyAsync(o => o.Name == orgName))
            throw AppException.Conflict($"An organization named '{orgName}' already exists.");

        // Create the organization first so the new user can reference it.
        var organization = new Organization
        {
            Name = orgName,
            Slug = await UniqueSlugAsync(orgName),
            IsActive = true,
        };
        _db.Organizations.Add(organization);
        await _db.SaveChangesAsync();

        var user = new ApplicationUser
        {
            OrganizationId = organization.Id,
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            FullName = request.FullName.Trim(),
            Initials = InitialsOf(request.FullName),
            IsActive = true,
            MustChangePassword = false,
        };
        var created = await _users.CreateAsync(user, request.Password);
        if (!created.Succeeded)
        {
            // Roll back the org so a failed signup doesn't leave an empty tenant.
            _db.Organizations.Remove(organization);
            await _db.SaveChangesAsync();
            throw AppException.BadRequest(string.Join(" ", created.Errors.Select(e => e.Description)));
        }

        // The registrant is the organization's first administrator.
        await _users.AddToRoleAsync(user, Roles.Admin);

        return await IssueAsync(user);
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
        return await MapAsync(user);
    }

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
            user.Id, user.OrganizationId, user.Email!, user.FullName, roles, user.MustChangePassword);

        var refreshToken = _tokens.CreateRefreshToken();
        user.RefreshTokenHash = _tokens.HashRefreshToken(refreshToken);
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(_settings.RefreshTokenDays);
        await _users.UpdateAsync(user);

        return new AuthResponse(accessToken, refreshToken, expiresAt, await MapAsync(user, roles), user.MustChangePassword);
    }

    private async Task<CurrentUserDto> MapAsync(ApplicationUser u, IList<string>? roles = null)
    {
        roles ??= await _users.GetRolesAsync(u);
        var orgName = await _db.Organizations
            .Where(o => o.Id == u.OrganizationId)
            .Select(o => o.Name)
            .FirstOrDefaultAsync() ?? "";

        return new CurrentUserDto(
            u.Id, u.Email!, u.FullName, u.Initials, u.Title, u.Department, u.AvatarColor,
            roles.ToList(), u.MustChangePassword, u.OrganizationId, orgName);
    }

    /// <summary>Slugify the org name and disambiguate against existing slugs.</summary>
    private async Task<string> UniqueSlugAsync(string name)
    {
        var baseSlug = SlugRegex().Replace(name.ToLowerInvariant(), "-").Trim('-');
        if (string.IsNullOrEmpty(baseSlug)) baseSlug = "org";

        var slug = baseSlug;
        var n = 2;
        while (await _db.Organizations.AnyAsync(o => o.Slug == slug))
            slug = $"{baseSlug}-{n++}";
        return slug;
    }

    private static string InitialsOf(string fullName)
    {
        var parts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0) return "?";
        if (parts.Length == 1) return parts[0][..Math.Min(2, parts[0].Length)].ToUpperInvariant();
        return $"{char.ToUpperInvariant(parts[0][0])}{char.ToUpperInvariant(parts[^1][0])}";
    }

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex SlugRegex();
}
