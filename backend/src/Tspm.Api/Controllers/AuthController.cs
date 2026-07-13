using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tspm.Api.Filters;
using Tspm.Application.Auth;
using Tspm.Application.Common.Interfaces;

namespace Tspm.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    private readonly ICurrentUser _currentUser;

    public AuthController(IAuthService auth, ICurrentUser currentUser)
    {
        _auth = auth;
        _currentUser = currentUser;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var result = await _auth.LoginAsync(request);
        return result is null
            ? Unauthorized(new { message = "Invalid email or password." })
            : Ok(result);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest request)
    {
        var result = await _auth.RefreshAsync(request);
        return result is null
            ? Unauthorized(new { message = "Invalid or expired refresh token." })
            : Ok(result);
    }

    [HttpPost("logout")]
    [Authorize]
    [AllowWhilePasswordChangeRequired]
    public async Task<IActionResult> Logout()
    {
        if (_currentUser.Id is { } id)
            await _auth.LogoutAsync(id);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    [AllowWhilePasswordChangeRequired]
    public async Task<ActionResult<CurrentUserDto>> Me()
    {
        if (_currentUser.Id is not { } id) return Unauthorized();
        var user = await _auth.GetCurrentUserAsync(id);
        return user is null ? Unauthorized() : Ok(user);
    }

    /// <summary>
    /// Serves both the forced first-login change (while on a one-time password) and a
    /// voluntary change. Returns fresh, unrestricted tokens on success.
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    [AllowWhilePasswordChangeRequired]
    public async Task<ActionResult<AuthResponse>> ChangePassword(ChangePasswordRequest request)
    {
        if (_currentUser.Id is not { } id) return Unauthorized();
        var result = await _auth.ChangePasswordAsync(id, request);
        return result is null ? Unauthorized() : Ok(result);
    }
}
