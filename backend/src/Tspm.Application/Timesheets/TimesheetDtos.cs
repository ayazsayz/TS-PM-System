namespace Tspm.Application.Timesheets;

public record WeekRowDto(
    Guid ProjectId,
    string ProjectName,
    string Client,
    string ColorHex,
    string Task,
    decimal[] Cells,
    decimal Total);

/// <summary>
/// Sets the total hours for one cell of the weekly grid (a project+task on a day).
/// Upserts: creates, updates, or clears the underlying time entries.
/// </summary>
public record SetCellRequest(
    Guid ProjectId,
    string Task,
    DateOnly Date,
    decimal Hours);

public record WeeklyTimesheetDto(
    DateOnly WeekStart,
    string Status,
    decimal TotalHours,
    int WeekPercent,
    decimal Remaining,
    int BillablePercent,
    decimal[] DayTotals,
    IReadOnlyList<WeekRowDto> Rows);
