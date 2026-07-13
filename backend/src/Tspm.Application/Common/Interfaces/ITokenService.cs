namespace Tspm.Application.Common.Interfaces;

public interface ITokenService
{
    /// <summary>
    /// Issues an access token. When <paramref name="mustChangePassword"/> is true the
    /// token carries the <see cref="MustChangePasswordClaim"/> and is restricted to the
    /// change-password endpoint.
    /// </summary>
    (string Token, DateTime ExpiresAt) CreateAccessToken(
        Guid userId,
        string email,
        string fullName,
        IEnumerable<string> roles,
        bool mustChangePassword);

    string CreateRefreshToken();

    /// <summary>Stable hash of a refresh token for at-rest storage/comparison.</summary>
    string HashRefreshToken(string refreshToken);

    /// <summary>Claim type marking a password-change-only (restricted) token.</summary>
    const string MustChangePasswordClaim = "must_change_password";
}
