using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common.Interfaces;

namespace Tspm.Infrastructure.Identity;

public class UserDirectory : IUserDirectory
{
    private readonly UserManager<ApplicationUser> _users;

    public UserDirectory(UserManager<ApplicationUser> users) => _users = users;

    public async Task<UserSummary?> GetAsync(Guid id)
    {
        var u = await _users.FindByIdAsync(id.ToString());
        if (u is null) return null;
        var roles = await _users.GetRolesAsync(u);
        return Map(u, roles);
    }

    public async Task<IReadOnlyList<UserSummary>> GetAllAsync()
    {
        var list = await _users.Users.AsNoTracking().ToListAsync();
        var result = new List<UserSummary>(list.Count);
        foreach (var u in list)
            result.Add(Map(u, await _users.GetRolesAsync(u)));
        return result;
    }

    public async Task<IReadOnlyDictionary<Guid, UserSummary>> GetManyAsync(IEnumerable<Guid> ids)
    {
        var idSet = ids.Distinct().ToList();
        var list = await _users.Users.AsNoTracking().Where(u => idSet.Contains(u.Id)).ToListAsync();
        var result = new Dictionary<Guid, UserSummary>();
        foreach (var u in list)
            result[u.Id] = Map(u, await _users.GetRolesAsync(u));
        return result;
    }

    private static UserSummary Map(ApplicationUser u, IList<string> roles) =>
        new(u.Id, u.FullName, u.Initials, u.Title, u.Department, u.AvatarColor, roles.ToList());
}
