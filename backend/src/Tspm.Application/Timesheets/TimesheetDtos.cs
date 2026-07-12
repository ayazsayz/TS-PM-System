namespace Tspm.Application.Timesheets;

public record WeekRowDto(
    Guid ProjectId,
    string ProjectName,
    string Client,
    string ColorHex,
    string Task,
    decimal[] Cells,
    decimal Total);

public record WeeklyTimesheetDto(
    DateOnly WeekStart,
    string Status,
    decimal TotalHours,
    int WeekPercent,
    decimal Remaining,
    int BillablePercent,
    decimal[] DayTotals,
    IReadOnlyList<WeekRowDto> Rows);
