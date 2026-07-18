using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common.Interfaces;

namespace Tspm.Infrastructure.Identity;

public class UserDirectory : IUserDirectory
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly ICurrentTenant _tenant;

    public UserDirectory(UserManager<ApplicationUser> users, ICurrentTenant tenant)
    {
        _users = users;
        _tenant = tenant;
    }

    /// <summary>Only ever returns users within the caller's organization.</summary>
    private IQueryable<ApplicationUser> Scoped =>
        _users.Users.AsNoTracking().Where(u => u.OrganizationId == _tenant.OrganizationId);

    public async Task<UserSummary?> GetAsync(Guid id)
    {
        var u = await Scoped.FirstOrDefaultAsync(x => x.Id == id);
        if (u is null) return null;
        return Map(u, await _users.GetRolesAsync(u));
    }

    public async Task<IReadOnlyList<UserSummary>> GetAllAsync()
    {
        var list = await Scoped.ToListAsync();
        var result = new List<UserSummary>(list.Count);
        foreach (var u in list)
            result.Add(Map(u, await _users.GetRolesAsync(u)));
        return result;
    }

    public async Task<IReadOnlyDictionary<Guid, UserSummary>> GetManyAsync(IEnumerable<Guid> ids)
    {
        var idSet = ids.Distinct().ToList();
        var list = await Scoped.Where(u => idSet.Contains(u.Id)).ToListAsync();
        var result = new Dictionary<Guid, UserSummary>();
        foreach (var u in list)
            result[u.Id] = Map(u, await _users.GetRolesAsync(u));
        return result;
    }

    private static UserSummary Map(ApplicationUser u, IList<string> roles) =>
        new(u.Id, u.FullName, u.Initials, u.Title, u.Department, u.AvatarColor, roles.ToList());
}
