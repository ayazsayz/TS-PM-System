using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common;
using Tspm.Application.Common.Interfaces;
using Tspm.Application.SuperAdmin;
using Tspm.Domain.Common;
using Tspm.Infrastructure.Persistence;

namespace Tspm.Infrastructure.Identity;

/// <summary>Cross-tenant user administration for SuperAdmin. No tenant filter applied.</summary>
public class SuperAdminUserService : ISuperAdminUserService
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly AppDbContext _db;
    private readonly IAuditLogger _audit;

    public SuperAdminUserService(UserManager<ApplicationUser> users, AppDbContext db, IAuditLogger audit)
    {
        _users = users;
        _db = db;
        _audit = audit;
    }

    public async Task<IReadOnlyList<SuperAdminUserDto>> ListAsync(string? search, Guid? organizationId, string? role, string? status)
    {
        var query = _users.Users.AsNoTracking();
        if (organizationId is Guid orgId) query = query.Where(u => u.OrganizationId == orgId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(u => u.FullName.Contains(s) || u.Email!.Contains(s));
        }

        var users = await query.OrderBy(u => u.FullName).ToListAsync();

        // Preload orgs the returned users belong to (single lookup).
        var orgIds = users.Select(u => u.OrganizationId).Distinct().ToList();
        var orgs = await _db.Organizations
            .Where(o => orgIds.Contains(o.Id))
            .ToDictionaryAsync(o => o.Id);

        var results = new List<SuperAdminUserDto>(users.Count);
        foreach (var u in users)
        {
            var roles = await _users.GetRolesAsync(u);
            if (!string.IsNullOrWhiteSpace(role) && !roles.Contains(role)) continue;

            orgs.TryGetValue(u.OrganizationId, out var org);
            var dto = Map(u, roles, org?.Name ?? "—", org?.Slug ?? "—");

            if (!string.IsNullOrWhiteSpace(status) &&
                !string.Equals(dto.Status, status, StringComparison.OrdinalIgnoreCase)) continue;

            results.Add(dto);
        }
        return results;
    }

    public async Task<SuperAdminUserDto?> GetAsync(Guid id)
    {
        var user = await _users.FindByIdAsync(id.ToString());
        if (user is null) return null;
        var org = await _db.Organizations.FirstOrDefaultAsync(o => o.Id == user.OrganizationId);
        return Map(user, await _users.GetRolesAsync(user), org?.Name ?? "—", org?.Slug ?? "—");
    }

    public async Task<SuperAdminUserDto?> SetActiveAsync(Guid id, bool isActive, Guid actingUserId)
    {
        var user = await _users.FindByIdAsync(id.ToString());
        if (user is null) return null;

        if (id == actingUserId && !isActive)
            throw AppException.BadRequest("You cannot deactivate your own account.");

        user.IsActive = isActive;
        await _users.UpdateAsync(user);

        _audit.Log(actingUserId, user.OrganizationId, isActive ? "superadmin.user.activate" : "superadmin.user.deactivate", $"{(isActive ? "Activated" : "Deactivated")} user {user.FullName} <{user.Email}>.", "User", user.Id);
        await _db.SaveChangesAsync(default);

        var org = await _db.Organizations.FirstOrDefaultAsync(o => o.Id == user.OrganizationId);
        return Map(user, await _users.GetRolesAsync(user), org?.Name ?? "—", org?.Slug ?? "—");
    }

    public async Task<SuperAdminUserDto?> SetRolesAsync(Guid id, IReadOnlyList<string> roles, Guid actingUserId)
    {
        var user = await _users.FindByIdAsync(id.ToString());
        if (user is null) return null;

        if (id == actingUserId)
            throw AppException.BadRequest("You cannot change your own roles.");

        var target = NormalizeRoles(roles);
        var current = await _users.GetRolesAsync(user);
        await _users.RemoveFromRolesAsync(user, current.Except(target));
        await _users.AddToRolesAsync(user, target.Except(current));

        _audit.Log(actingUserId, user.OrganizationId, "superadmin.user.roles.change", $"Roles for {user.FullName} set to [{string.Join(", ", target)}] (was [{string.Join(", ", current)}]).", "User", user.Id);
        await _db.SaveChangesAsync(default);

        var org = await _db.Organizations.FirstOrDefaultAsync(o => o.Id == user.OrganizationId);
        return Map(user, target, org?.Name ?? "—", org?.Slug ?? "—");
    }

    public async Task<string?> ResetPasswordAsync(Guid id, Guid actingUserId)
    {
        var user = await _users.FindByIdAsync(id.ToString());
        if (user is null) return null;

        var oneTimePassword = PasswordGenerator.Generate();
        var token = await _users.GeneratePasswordResetTokenAsync(user);
        var result = await _users.ResetPasswordAsync(user, token, oneTimePassword);
        if (!result.Succeeded)
            throw AppException.BadRequest(string.Join(" ", result.Errors.Select(e => e.Description)));

        user.MustChangePassword = true;
        user.RefreshTokenHash = null;
        user.RefreshTokenExpiresAt = null;
        await _users.UpdateAsync(user);

        _audit.Log(actingUserId, user.OrganizationId, "superadmin.user.password.reset", $"Password reset for {user.FullName} <{user.Email}> (must change on next login).", "User", user.Id);
        await _db.SaveChangesAsync(default);

        return oneTimePassword;
    }

    private static IReadOnlyList<string> NormalizeRoles(IReadOnlyList<string>? roles)
    {
        var valid = (roles ?? [])
            .Where(r => AppRoles.All.Contains(r, StringComparer.OrdinalIgnoreCase))
            .Select(r => AppRoles.All.First(a => string.Equals(a, r, StringComparison.OrdinalIgnoreCase)))
            .Distinct()
            .ToList();
        if (valid.Count == 0) valid.Add(AppRoles.Employee);
        return valid;
    }

    private static SuperAdminUserDto Map(ApplicationUser u, IEnumerable<string> roles, string orgName, string orgSlug)
    {
        var rolesList = roles.ToList();
        var status = !u.IsActive ? "Inactive" : u.MustChangePassword ? "Invited" : "Active";
        return new SuperAdminUserDto(
            u.Id, u.Email ?? string.Empty, u.FullName, u.Initials, u.AvatarColor,
            u.OrganizationId, orgName, orgSlug,
            rolesList, u.IsActive, u.MustChangePassword, status, u.LastLoginAt, u.CreatedAt);
    }
}
