namespace Tspm.Application.Common.Interfaces;

public record UserSummary(
    Guid Id,
    string FullName,
    string Initials,
    string? Title,
    string? Department,
    string AvatarColor,
    IReadOnlyList<string> Roles);

/// <summary>Read access to user profiles for the Application layer (which
/// cannot see the Identity ApplicationUser type directly).</summary>
public interface IUserDirectory
{
    Task<UserSummary?> GetAsync(Guid id);
    Task<IReadOnlyList<UserSummary>> GetAllAsync();
    Task<IReadOnlyDictionary<Guid, UserSummary>> GetManyAsync(IEnumerable<Guid> ids);
}
