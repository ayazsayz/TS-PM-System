using Tspm.Domain.Common;

namespace Tspm.Domain.Entities;

/// <summary>A subscription plan (Free, Pro, Enterprise, etc.) offered to tenants.</summary>
public class Plan : Entity
{
    /// <summary>Machine-readable identifier (e.g. "free", "pro"). Unique.</summary>
    public string Code { get; set; } = default!;

    public string Name { get; set; } = default!;

    public string? Description { get; set; }

    /// <summary>Monthly recurring price. 0 for free plans.</summary>
    public decimal MonthlyPrice { get; set; }

    /// <summary>Yearly price (usually a discount vs 12x monthly). 0 if not offered.</summary>
    public decimal YearlyPrice { get; set; }

    /// <summary>ISO-4217 currency code (e.g. "USD"). Defaults to USD.</summary>
    public string Currency { get; set; } = "USD";

    /// <summary>Maximum active users allowed on this plan. null = unlimited.</summary>
    public int? MaxUsers { get; set; }

    /// <summary>Maximum concurrent projects allowed. null = unlimited.</summary>
    public int? MaxProjects { get; set; }

    /// <summary>Comma-separated feature codes bundled with this plan (e.g. "api,sso,audit").</summary>
    public string? Features { get; set; }

    /// <summary>Whether this plan can be assigned to new subscriptions.</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>Presentation order in pricing tables.</summary>
    public int SortOrder { get; set; }
}
