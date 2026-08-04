using Tspm.Domain.Enums;

namespace Tspm.Application.SuperAdmin;

public record PlanDto(
    Guid Id,
    string Code,
    string Name,
    string? Description,
    decimal MonthlyPrice,
    decimal YearlyPrice,
    string Currency,
    int? MaxUsers,
    int? MaxProjects,
    IReadOnlyList<string> Features,
    bool IsActive,
    int SortOrder,
    DateTime CreatedAt);

public record CreatePlanRequest(
    string Code,
    string Name,
    string? Description,
    decimal MonthlyPrice,
    decimal YearlyPrice,
    string? Currency,
    int? MaxUsers,
    int? MaxProjects,
    IReadOnlyList<string>? Features,
    int SortOrder);

public record UpdatePlanRequest(
    string? Name,
    string? Description,
    decimal? MonthlyPrice,
    decimal? YearlyPrice,
    string? Currency,
    int? MaxUsers,
    int? MaxProjects,
    IReadOnlyList<string>? Features,
    int? SortOrder);

public record SubscriptionDto(
    Guid Id,
    Guid OrganizationId,
    string OrganizationName,
    Guid PlanId,
    string PlanName,
    string PlanCode,
    SubscriptionStatus Status,
    BillingCycle BillingCycle,
    DateTime StartedAt,
    DateTime? CurrentPeriodEnd,
    DateTime? TrialEndsAt,
    DateTime? CancelledAt);

public record AssignSubscriptionRequest(
    Guid PlanId,
    BillingCycle BillingCycle,
    DateTime? TrialEndsAt);
