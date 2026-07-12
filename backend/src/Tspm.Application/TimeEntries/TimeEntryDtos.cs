namespace Tspm.Application.TimeEntries;

public record TimeEntryDto(
    Guid Id,
    Guid ProjectId,
    string ProjectName,
    string ProjectColor,
    DateOnly Date,
    string Task,
    string? Description,
    string? Start,
    string? End,
    string? Break,
    bool Billable,
    decimal Hours);

public record UpsertTimeEntryRequest(
    Guid ProjectId,
    DateOnly Date,
    string Task,
    string? Description,
    string? Start,
    string? End,
    string? Break,
    bool Billable,
    decimal Hours);

public record DuplicateDayRequest(DateOnly FromDate, DateOnly ToDate);
