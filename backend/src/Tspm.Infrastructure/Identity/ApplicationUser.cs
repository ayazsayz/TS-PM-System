using Microsoft.AspNetCore.Identity;

namespace Tspm.Infrastructure.Identity;

/// <summary>
/// Identity user with profile fields used across the app. Lives in
/// Infrastructure (tied to ASP.NET Identity); domain entities reference it by
/// <see cref="Guid"/> UserId.
/// </summary>
public class ApplicationUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;
    public string Initials { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Department { get; set; }
    public string AvatarColor { get; set; } = "#475467";
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// True while the user is still on an admin-issued one-time password. Until they
    /// change it, their token is restricted to the change-password endpoint only.
    /// </summary>
    public bool MustChangePassword { get; set; }

    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Refresh-token rotation (hash stored, never the raw token).
    public string? RefreshTokenHash { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }
}
