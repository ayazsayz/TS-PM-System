using Tspm.Domain.Common;
using Tspm.Domain.Enums;

namespace Tspm.Domain.Entities;

/// <summary>Association between an organization and the plan it is currently on.</summary>
public class Subscription : Entity
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = default!;

    public Guid PlanId { get; set; }
    public Plan Plan { get; set; } = default!;

    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;
    public BillingCycle BillingCycle { get; set; } = BillingCycle.Monthly;

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    /// <summary>End of the current billing period (renewal / trial end).</summary>
    public DateTime? CurrentPeriodEnd { get; set; }

    public DateTime? TrialEndsAt { get; set; }
    public DateTime? CancelledAt { get; set; }
}
