namespace Tspm.Application.Dashboard;

public record EmployeeDashboardDto(
    DateOnly ReferenceDate,
    decimal TodayHours,
    int DayTarget,
    decimal WeekHours,
    int WeekTarget,
    int WeekPercent,
    int BillablePercent,
    int PendingWeeks);

public record ManagerDashboardDto(
    int PendingApprovals,
    decimal PendingHours,
    int MissingTimesheets,
    int TeamUtilizationPercent,
    int ProjectsAtRisk);
