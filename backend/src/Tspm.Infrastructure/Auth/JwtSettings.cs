namespace Tspm.Infrastructure.Auth;

public class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "Tspm.Api";
    public string Audience { get; set; } = "Tspm.Client";
    public int AccessTokenMinutes { get; set; } = 30;
    public int RefreshTokenDays { get; set; } = 14;
    public string SigningKey { get; set; } = string.Empty;

    /// <summary>
    /// Insecure fallback used only for local development when no SigningKey is
    /// configured. Must be ≥32 bytes for HMAC-SHA256. Set a real key in
    /// production (user-secrets / environment / key vault).
    /// </summary>
    public const string DevFallbackKey = "tspm-dev-only-insecure-signing-key-change-me-in-production";

    public string EffectiveSigningKey =>
        string.IsNullOrWhiteSpace(SigningKey) ? DevFallbackKey : SigningKey;
}
