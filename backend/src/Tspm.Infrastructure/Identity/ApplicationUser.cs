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

    // Refresh-token rotation (hash stored, never the raw token).
    public string? RefreshTokenHash { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }
}
