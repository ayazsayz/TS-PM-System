namespace Tspm.Application.Projects;

public record TeamMemberDto(Guid UserId, string Initials, string AvatarColor, string FullName);

public record ProjectDto(
    Guid Id,
    string Name,
    Guid ClientId,
    string Client,
    string ColorHex,
    int EstimatedHours,
    /// <summary>Computed from logged time entries.</summary>
    decimal ActualHours,
    decimal RemainingHours,
    decimal Budget,
    decimal HourlyRate,
    /// <summary>Computed: ActualHours × HourlyRate.</summary>
    decimal Spent,
    int BudgetPercent,
    string? Due,
    string Health,
    int CompletionPct,
    string? Warn,
    bool IsInternal,
    bool IsArchived,
    IReadOnlyList<TeamMemberDto> Team);

/// <summary>Compact project row for the dashboard "My projects" list.</summary>
public record MyProjectDto(
    Guid Id,
    string Name,
    string Client,
    string ColorHex,
    int CompletionPct);

public record UpsertProjectRequest(
    string Name,
    Guid ClientId,
    string ColorHex,
    int EstimatedHours,
    decimal Budget,
    decimal HourlyRate,
    DateOnly? DueDate,
    string Health,
    int CompletionPct,
    string? Warn,
    bool IsInternal,
    IReadOnlyList<Guid> TeamUserIds);

public record SetProjectArchivedRequest(bool IsArchived);
