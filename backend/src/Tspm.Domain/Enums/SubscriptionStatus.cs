namespace Tspm.Domain.Enums;

public enum SubscriptionStatus
{
    Trialing = 0,
    Active = 1,
    PastDue = 2,
    Cancelled = 3,
    Suspended = 4,
}

public enum BillingCycle
{
    Monthly = 0,
    Yearly = 1,
}
