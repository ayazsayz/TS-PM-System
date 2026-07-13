namespace Tspm.Application.Reports;

public record EstVsActualDto(string Project, int Estimated, int Actual, int Percent);

public record ClientBillingDto(string Client, int Hours, decimal Spend, int Projects);

public record BillableSplitDto(decimal BillableHours, decimal NonBillableHours, int BillablePercent);

public record ReportsSummaryDto(
    decimal TotalBudget,
    decimal TotalSpent,
    int BudgetUsedPercent,
    int TotalEstimatedHours,
    int TotalActualHours,
    int AvgUtilizationPercent,
    BillableSplitDto BillableSplit,
    IReadOnlyList<EstVsActualDto> EstVsActual,
    IReadOnlyList<ClientBillingDto> ClientBilling);
