using Tspm.Application.SuperAdmin;

namespace Tspm.Application.SuperAdmin;

public interface ISuperAdminService
{
    Task<IReadOnlyList<SuperAdminOrganizationDto>> ListOrganizationsAsync();
    Task<SuperAdminOrganizationDto?> GetOrganizationAsync(Guid id);
    Task<SuperAdminOrganizationDto> CreateOrganizationAsync(CreateOrganizationRequest request);
    Task<SuperAdminOrganizationDto?> UpdateOrganizationAsync(Guid id, UpdateOrganizationRequest request);
    Task<bool> SetActiveAsync(Guid id, bool isActive);

    // Plans
    Task<IReadOnlyList<PlanDto>> ListPlansAsync(bool includeInactive);
    Task<PlanDto?> GetPlanAsync(Guid id);
    Task<PlanDto> CreatePlanAsync(CreatePlanRequest request);
    Task<PlanDto?> UpdatePlanAsync(Guid id, UpdatePlanRequest request);
    Task<bool> SetPlanActiveAsync(Guid id, bool isActive);

    // Subscriptions
    Task<IReadOnlyList<SubscriptionDto>> ListSubscriptionsAsync();
    Task<SubscriptionDto?> GetSubscriptionForOrganizationAsync(Guid organizationId);
    Task<SubscriptionDto> AssignSubscriptionAsync(Guid organizationId, AssignSubscriptionRequest request);
    Task<bool> CancelSubscriptionAsync(Guid organizationId);
}
