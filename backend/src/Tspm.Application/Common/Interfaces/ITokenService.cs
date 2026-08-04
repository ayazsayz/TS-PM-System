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
        Guid organizationId,
        string email,
        string fullName,
        IEnumerable<string> roles,
        bool mustChangePassword);

    /// <summary>Issues a short-lived access token that carries an <see cref="ImpersonatorClaim"/> identifying the acting SuperAdmin.</summary>
    (string Token, DateTime ExpiresAt) CreateImpersonationAccessToken(
        Guid userId,
        Guid organizationId,
        string email,
        string fullName,
        IEnumerable<string> roles,
        Guid impersonatorId,
        string impersonatorEmail);

    string CreateRefreshToken();

    /// <summary>Stable hash of a refresh token for at-rest storage/comparison.</summary>
    string HashRefreshToken(string refreshToken);

    /// <summary>Claim type marking a password-change-only (restricted) token.</summary>
    const string MustChangePasswordClaim = "must_change_password";

    /// <summary>Claim type carrying the caller's organization (tenant) id.</summary>
    const string OrganizationClaim = "org";

    /// <summary>Claim type carrying the impersonating SuperAdmin's user id.</summary>
    const string ImpersonatorClaim = "imp";

    /// <summary>Claim type carrying the impersonating SuperAdmin's email (for the UI banner).</summary>
    const string ImpersonatorEmailClaim = "imp_email";
}
