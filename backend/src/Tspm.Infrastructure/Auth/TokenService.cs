using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Tspm.Application.Common.Interfaces;

namespace Tspm.Infrastructure.Auth;

public class TokenService : ITokenService
{
    private readonly JwtSettings _settings;

    public TokenService(IOptions<JwtSettings> settings) => _settings = settings.Value;

    public (string Token, DateTime ExpiresAt) CreateAccessToken(
        Guid userId,
        Guid organizationId,
        string email,
        string fullName,
        IEnumerable<string> roles,
        bool mustChangePassword)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(_settings.AccessTokenMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ITokenService.OrganizationClaim, organizationId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new(ClaimTypes.Name, fullName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        if (mustChangePassword)
            claims.Add(new Claim(ITokenService.MustChangePasswordClaim, "true"));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.EffectiveSigningKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    public (string Token, DateTime ExpiresAt) CreateImpersonationAccessToken(
        Guid userId,
        Guid organizationId,
        string email,
        string fullName,
        IEnumerable<string> roles,
        Guid impersonatorId,
        string impersonatorEmail)
    {
        // Deliberately shorter-lived than a normal session.
        var expiresAt = DateTime.UtcNow.AddMinutes(Math.Min(_settings.AccessTokenMinutes, 30));

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ITokenService.OrganizationClaim, organizationId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new(ClaimTypes.Name, fullName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ITokenService.ImpersonatorClaim, impersonatorId.ToString()),
            new(ITokenService.ImpersonatorEmailClaim, impersonatorEmail),
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.EffectiveSigningKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    public string CreateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    public string HashRefreshToken(string refreshToken)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));
        return Convert.ToBase64String(hash);
    }
}
