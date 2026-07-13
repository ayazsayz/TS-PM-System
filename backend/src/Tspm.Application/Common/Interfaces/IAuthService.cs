using Tspm.Application.Auth;

namespace Tspm.Application.Common.Interfaces;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<AuthResponse?> RefreshAsync(RefreshRequest request);
    Task LogoutAsync(Guid userId);
    Task<CurrentUserDto?> GetCurrentUserAsync(Guid userId);

    /// <summary>Serves both the forced first-login change and voluntary changes.</summary>
    Task<AuthResponse?> ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
}
