namespace Tspm.Application.Projects;

public record TeamMemberDto(Guid UserId, string Initials, string AvatarColor);

public record ProjectDto(
    Guid Id,
    string Name,
    string Client,
    string ColorHex,
    int EstimatedHours,
    int ActualHours,
    int RemainingHours,
    decimal Budget,
    decimal Spent,
    int BudgetPercent,
    string? Due,
    string Health,
    int CompletionPct,
    string? Warn,
    bool IsInternal,
    IReadOnlyList<TeamMemberDto> Team);

/// <summary>Compact project row for the dashboard "My projects" list.</summary>
public record MyProjectDto(
    Guid Id,
    string Name,
    string Client,
    string ColorHex,
    int CompletionPct);
