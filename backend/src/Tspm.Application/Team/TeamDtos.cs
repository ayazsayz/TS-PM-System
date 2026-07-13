namespace Tspm.Application.Team;

public record UtilizationDto(
    Guid UserId,
    string Name,
    string Initials,
    string AvatarColor,
    int UtilizationPercent);

public record MissingTimesheetDto(
    Guid UserId,
    string Name,
    string Initials,
    string Department,
    string AvatarColor);

public record TopPerformerDto(
    int Rank,
    string Name,
    string Initials,
    string AvatarColor,
    int UtilizationPercent);
