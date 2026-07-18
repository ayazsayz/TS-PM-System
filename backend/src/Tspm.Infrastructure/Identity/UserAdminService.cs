using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Tspm.Application.Admin;
using Tspm.Application.Common;
using Tspm.Application.Common.Interfaces;
using Tspm.Domain.Common;

namespace Tspm.Infrastructure.Identity;

public class UserAdminService : IUserAdminService
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly ICurrentTenant _tenant;

    public UserAdminService(UserManager<ApplicationUser> users, ICurrentTenant tenant)
    {
        _users = users;
        _tenant = tenant;
    }

    private Guid Tenant => _tenant.OrganizationId ?? Guid.Empty;

    /// <summary>Finds a user only if they belong to the caller's organization.</summary>
    private async Task<ApplicationUser?> FindInTenantAsync(Guid id)
    {
        var user = await _users.FindByIdAsync(id.ToString());
        return user is not null && user.OrganizationId == Tenant ? user : null;
    }

    public async Task<IReadOnlyList<AdminUserDto>> ListAsync(string? search, string? role, string? status)
    {
        var query = _users.Users.AsNoTracking().Where(u => u.OrganizationId == Tenant);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(u => u.FullName.Contains(s) || u.Email!.Contains(s));
        }

        var list = await query.OrderBy(u => u.FullName).ToListAsync();

        var result = new List<AdminUserDto>(list.Count);
        foreach (var u in list)
        {
            var roles = await _users.GetRolesAsync(u);
            if (!string.IsNullOrWhiteSpace(role) && !roles.Contains(role)) continue;

            var dto = Map(u, roles);
            if (!string.IsNullOrWhiteSpace(status) &&
                !string.Equals(dto.Status, status, StringComparison.OrdinalIgnoreCase)) continue;

            result.Add(dto);
        }
        return result;
    }

    public async Task<AdminUserDto?> GetAsync(Guid id)
    {
        var user = await FindInTenantAsync(id);
        if (user is null) return null;
        return Map(user, await _users.GetRolesAsync(user));
    }

    public async Task<CreateUserResponse> CreateAsync(CreateUserRequest request)
    {
        var email = request.Email.Trim();
        if (await _users.FindByEmailAsync(email) is not null)
            throw AppException.Conflict($"A user with the email '{email}' already exists.");

        var roles = NormalizeRoles(request.Roles);

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            OrganizationId = Tenant,
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            FullName = request.FullName.Trim(),
            Initials = InitialsFrom(request.FullName),
            Title = request.Title,
            Department = request.Department,
            AvatarColor = string.IsNullOrWhiteSpace(request.AvatarColor) ? "#475467" : request.AvatarColor,
            IsActive = true,
            MustChangePassword = true,
        };

        var oneTimePassword = PasswordGenerator.Generate();
        var created = await _users.CreateAsync(user, oneTimePassword);
        if (!created.Succeeded)
            throw AppException.BadRequest(string.Join(" ", created.Errors.Select(e => e.Description)));

        await _users.AddToRolesAsync(user, roles);

        return new CreateUserResponse(Map(user, roles), oneTimePassword);
    }

    public async Task<AdminUserDto?> UpdateAsync(Guid id, UpdateUserRequest request)
    {
        var user = await FindInTenantAsync(id);
        if (user is null) return null;

        user.FullName = request.FullName.Trim();
        user.Initials = InitialsFrom(request.FullName);
        user.Title = request.Title;
        user.Department = request.Department;
        if (!string.IsNullOrWhiteSpace(request.AvatarColor)) user.AvatarColor = request.AvatarColor;

        await _users.UpdateAsync(user);
        return Map(user, await _users.GetRolesAsync(user));
    }

    public async Task<AdminUserDto?> SetRolesAsync(Guid id, IReadOnlyList<string> roles, Guid actingUserId)
    {
        var user = await FindInTenantAsync(id);
        if (user is null) return null;

        if (id == actingUserId)
            throw AppException.BadRequest("You cannot change your own roles.");

        var target = NormalizeRoles(roles);
        var current = await _users.GetRolesAsync(user);

        // Don't allow removing the final admin.
        if (current.Contains(AppRoles.Admin) && !target.Contains(AppRoles.Admin))
            await EnsureNotLastAdminAsync(user);

        await _users.RemoveFromRolesAsync(user, current.Except(target));
        await _users.AddToRolesAsync(user, target.Except(current));

        return Map(user, target);
    }

    public async Task<AdminUserDto?> SetActiveAsync(Guid id, bool isActive, Guid actingUserId)
    {
        var user = await FindInTenantAsync(id);
        if (user is null) return null;

        if (id == actingUserId && !isActive)
            throw AppException.BadRequest("You cannot deactivate your own account.");

        if (!isActive) await EnsureNotLastAdminAsync(user);

        user.IsActive = isActive;
        await _users.UpdateAsync(user);
        return Map(user, await _users.GetRolesAsync(user));
    }

    public async Task<string?> ResetPasswordAsync(Guid id)
    {
        var user = await FindInTenantAsync(id);
        if (user is null) return null;

        var oneTimePassword = PasswordGenerator.Generate();
        var token = await _users.GeneratePasswordResetTokenAsync(user);
        var result = await _users.ResetPasswordAsync(user, token, oneTimePassword);
        if (!result.Succeeded)
            throw AppException.BadRequest(string.Join(" ", result.Errors.Select(e => e.Description)));

        user.MustChangePassword = true;
        // Invalidate any existing session.
        user.RefreshTokenHash = null;
        user.RefreshTokenExpiresAt = null;
        await _users.UpdateAsync(user);

        return oneTimePassword;
    }

    /// <summary>Throws if the given user is the last active admin <em>in their organization</em>.</summary>
    private async Task EnsureNotLastAdminAsync(ApplicationUser user)
    {
        var admins = (await _users.GetUsersInRoleAsync(AppRoles.Admin))
            .Where(a => a.OrganizationId == Tenant)
            .ToList();
        var otherActiveAdmins = admins.Count(a => a.Id != user.Id && a.IsActive);
        if (admins.Any(a => a.Id == user.Id) && otherActiveAdmins == 0)
            throw AppException.BadRequest("This is the last active administrator — assign another admin first.");
    }

    private static IReadOnlyList<string> NormalizeRoles(IReadOnlyList<string>? roles)
    {
        var valid = (roles ?? [])
            .Where(r => AppRoles.All.Contains(r, StringComparer.OrdinalIgnoreCase))
            .Select(r => AppRoles.All.First(a => string.Equals(a, r, StringComparison.OrdinalIgnoreCase)))
            .Distinct()
            .ToList();

        if (valid.Count == 0) valid.Add(AppRoles.Employee); // everyone is at least an employee
        return valid;
    }

    private static string InitialsFrom(string fullName)
    {
        var parts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0) return "?";
        if (parts.Length == 1) return parts[0][..Math.Min(2, parts[0].Length)].ToUpperInvariant();
        return $"{char.ToUpperInvariant(parts[0][0])}{char.ToUpperInvariant(parts[^1][0])}";
    }

    private static AdminUserDto Map(ApplicationUser u, IEnumerable<string> roles)
    {
        var status = !u.IsActive ? "Inactive" : u.MustChangePassword ? "Invited" : "Active";
        return new AdminUserDto(
            u.Id, u.Email!, u.FullName, u.Initials, u.Title, u.Department, u.AvatarColor,
            roles.ToList(), u.IsActive, u.MustChangePassword, status, u.LastLoginAt, u.CreatedAt);
    }
}
