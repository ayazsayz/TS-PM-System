using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tspm.Application.Admin;
using Tspm.Application.Common.Interfaces;
using Tspm.Infrastructure;

namespace Tspm.Api.Controllers;

[Route("api/admin/users")]
[Authorize(Policy = Policies.AdminOnly)]
public class AdminUsersController : ApiControllerBase
{
    private readonly IUserAdminService _users;

    public AdminUsersController(IUserAdminService users) => _users = users;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminUserDto>>> List(
        [FromQuery] string? search, [FromQuery] string? role, [FromQuery] string? status)
        => Ok(await _users.ListAsync(search, role, status));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AdminUserDto>> Get(Guid id)
    {
        var user = await _users.GetAsync(id);
        return user is null ? NotFound() : Ok(user);
    }

    /// <summary>Creates a user. The one-time password is returned here and never again.</summary>
    [HttpPost]
    public async Task<ActionResult<CreateUserResponse>> Create(CreateUserRequest request)
    {
        var result = await _users.CreateAsync(request);
        return CreatedAtAction(nameof(Get), new { id = result.User.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminUserDto>> Update(Guid id, UpdateUserRequest request)
    {
        var user = await _users.UpdateAsync(id, request);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPut("{id:guid}/roles")]
    public async Task<ActionResult<AdminUserDto>> SetRoles(Guid id, SetRolesRequest request)
    {
        var user = await _users.SetRolesAsync(id, request.Roles, UserId);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<AdminUserDto>> SetStatus(Guid id, SetStatusRequest request)
    {
        var user = await _users.SetActiveAsync(id, request.IsActive, UserId);
        return user is null ? NotFound() : Ok(user);
    }

    /// <summary>Issues a fresh one-time password and forces a change on next login.</summary>
    [HttpPost("{id:guid}/reset-password")]
    public async Task<ActionResult<OneTimePasswordResponse>> ResetPassword(Guid id)
    {
        var password = await _users.ResetPasswordAsync(id);
        return password is null ? NotFound() : Ok(new OneTimePasswordResponse(password));
    }
}
