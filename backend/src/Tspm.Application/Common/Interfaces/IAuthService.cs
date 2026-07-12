using Tspm.Application.Auth;

namespace Tspm.Application.Common.Interfaces;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<AuthResponse?> RefreshAsync(RefreshRequest request);
    Task LogoutAsync(Guid userId);
    Task<CurrentUserDto?> GetCurrentUserAsync(Guid userId);
}
