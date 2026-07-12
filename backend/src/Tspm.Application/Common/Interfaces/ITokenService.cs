namespace Tspm.Application.Common.Interfaces;

public interface ITokenService
{
    (string Token, DateTime ExpiresAt) CreateAccessToken(
        Guid userId,
        string email,
        string fullName,
        IEnumerable<string> roles);

    string CreateRefreshToken();

    /// <summary>Stable hash of a refresh token for at-rest storage/comparison.</summary>
    string HashRefreshToken(string refreshToken);
}
