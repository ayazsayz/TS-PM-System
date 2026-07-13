using Microsoft.AspNetCore.Mvc;
using Tspm.Application.Common.Interfaces;

namespace Tspm.Api.Controllers;

/// <summary>Lightweight, read-only directory for pickers (e.g. assigning a project team).</summary>
public record UserPickerDto(Guid Id, string FullName, string Initials, string AvatarColor, string? Department);

[Route("api/users")]
public class UsersController : ApiControllerBase
{
    private readonly IUserDirectory _users;

    public UsersController(IUserDirectory users) => _users = users;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UserPickerDto>>> List()
    {
        var users = await _users.GetAllAsync();
        return Ok(users
            .OrderBy(u => u.FullName)
            .Select(u => new UserPickerDto(u.Id, u.FullName, u.Initials, u.AvatarColor, u.Department))
            .ToList());
    }
}
