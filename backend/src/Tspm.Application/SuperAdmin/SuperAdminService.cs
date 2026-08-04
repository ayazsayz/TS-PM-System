using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common;
using Tspm.Application.Common.Interfaces;
using Tspm.Domain.Entities;
using Tspm.Domain.Enums;

namespace Tspm.Application.SuperAdmin;

public class SuperAdminService : ISuperAdminService
{
    private readonly IAppDbContext _db;
    private readonly IAuditLogger _audit;
    private readonly ICurrentUser _currentUser;

    public SuperAdminService(IAppDbContext db, IAuditLogger audit, ICurrentUser currentUser)
    {
        _db = db;
        _audit = audit;
        _currentUser = currentUser;
    }

    private Guid ActorId => _currentUser.Id ?? Guid.Empty;

    public async Task<IReadOnlyList<SuperAdminOrganizationDto>> ListOrganizationsAsync()
    {
        return await _db.Organizations
            .OrderBy(o => o.Name)
            .Select(o => new SuperAdminOrganizationDto(o.Id, o.Name, o.Slug, o.IsActive, o.CreatedAt))
            .ToListAsync();
    }

    public async Task<SuperAdminOrganizationDto?> GetOrganizationAsync(Guid id)
    {
        return await _db.Organizations
            .Where(o => o.Id == id)
            .Select(o => new SuperAdminOrganizationDto(o.Id, o.Name, o.Slug, o.IsActive, o.CreatedAt))
            .FirstOrDefaultAsync();
    }

    public async Task<SuperAdminOrganizationDto> CreateOrganizationAsync(CreateOrganizationRequest request)
    {
        var name = (request.Name ?? string.Empty).Trim();
        var slug = Slugify(request.Slug);
        if (name.Length == 0) throw AppException.BadRequest("Name is required.");
        if (slug.Length == 0) throw AppException.BadRequest("Slug is required.");

        if (await _db.Organizations.AnyAsync(o => o.Slug == slug))
            throw AppException.Conflict($"An organization with slug '{slug}' already exists.");
        if (await _db.Organizations.AnyAsync(o => o.Name == name))
            throw AppException.Conflict($"An organization named '{name}' already exists.");

        var org = new Organization { Name = name, Slug = slug, IsActive = true };
        _db.Organizations.Add(org);
        await _db.SaveChangesAsync(default);

        _audit.Log(ActorId, org.Id, "superadmin.org.create", $"Created organization {org.Name} ({org.Slug}).", "Organization", org.Id);
        await _db.SaveChangesAsync(default);

        return new SuperAdminOrganizationDto(org.Id, org.Name, org.Slug, org.IsActive, org.CreatedAt);
    }

    public async Task<SuperAdminOrganizationDto?> UpdateOrganizationAsync(Guid id, UpdateOrganizationRequest request)
    {
        var org = await _db.Organizations.FirstOrDefaultAsync(o => o.Id == id);
        if (org is null) return null;

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            var name = request.Name.Trim();
            if (name != org.Name && await _db.Organizations.AnyAsync(o => o.Id != id && o.Name == name))
                throw AppException.Conflict($"An organization named '{name}' already exists.");
            org.Name = name;
        }

        if (!string.IsNullOrWhiteSpace(request.Slug))
        {
            var slug = Slugify(request.Slug);
            if (slug != org.Slug && await _db.Organizations.AnyAsync(o => o.Id != id && o.Slug == slug))
                throw AppException.Conflict($"An organization with slug '{slug}' already exists.");
            org.Slug = slug;
        }

        await _db.SaveChangesAsync(default);
        _audit.Log(ActorId, org.Id, "superadmin.org.update", $"Updated organization {org.Name} ({org.Slug}).", "Organization", org.Id);
        await _db.SaveChangesAsync(default);
        return new SuperAdminOrganizationDto(org.Id, org.Name, org.Slug, org.IsActive, org.CreatedAt);
    }

    public async Task<bool> SetActiveAsync(Guid id, bool isActive)
    {
        var org = await _db.Organizations.FirstOrDefaultAsync(o => o.Id == id);
        if (org is null) return false;
        org.IsActive = isActive;
        _audit.Log(ActorId, org.Id, isActive ? "superadmin.org.activate" : "superadmin.org.suspend", $"{(isActive ? "Activated" : "Suspended")} organization {org.Name}.", "Organization", org.Id);
        await _db.SaveChangesAsync(default);
        return true;
    }

    private static string Slugify(string? value)
    {
        var s = (value ?? string.Empty).Trim().ToLowerInvariant();
        var sb = new System.Text.StringBuilder(s.Length);
        var prevDash = false;
        foreach (var c in s)
        {
            if (char.IsLetterOrDigit(c)) { sb.Append(c); prevDash = false; }
            else if (c is ' ' or '-' or '_' && !prevDash) { sb.Append('-'); prevDash = true; }
        }
        return sb.ToString().Trim('-');
    }

    // ---------------- Plans ----------------

    public async Task<IReadOnlyList<PlanDto>> ListPlansAsync(bool includeInactive)
    {
        var q = _db.Plans.AsQueryable();
        if (!includeInactive) q = q.Where(p => p.IsActive);
        var plans = await q.OrderBy(p => p.SortOrder).ThenBy(p => p.MonthlyPrice).ToListAsync();
        return plans.Select(ToDto).ToList();
    }

    public async Task<PlanDto?> GetPlanAsync(Guid id)
    {
        var plan = await _db.Plans.FirstOrDefaultAsync(p => p.Id == id);
        return plan is null ? null : ToDto(plan);
    }

    public async Task<PlanDto> CreatePlanAsync(CreatePlanRequest request)
    {
        var code = NormalizeCode(request.Code);
        var name = (request.Name ?? string.Empty).Trim();
        if (code.Length == 0) throw AppException.BadRequest("Plan code is required.");
        if (name.Length == 0) throw AppException.BadRequest("Plan name is required.");
        if (request.MonthlyPrice < 0 || request.YearlyPrice < 0)
            throw AppException.BadRequest("Prices cannot be negative.");

        if (await _db.Plans.AnyAsync(p => p.Code == code))
            throw AppException.Conflict($"A plan with code '{code}' already exists.");

        var plan = new Plan
        {
            Code = code,
            Name = name,
            Description = request.Description?.Trim(),
            MonthlyPrice = request.MonthlyPrice,
            YearlyPrice = request.YearlyPrice,
            Currency = NormalizeCurrency(request.Currency),
            MaxUsers = request.MaxUsers,
            MaxProjects = request.MaxProjects,
            Features = JoinFeatures(request.Features),
            SortOrder = request.SortOrder,
            IsActive = true,
        };
        _db.Plans.Add(plan);
        await _db.SaveChangesAsync(default);

        _audit.Log(ActorId, Guid.Empty, "superadmin.plan.create", $"Created plan {plan.Name} ({plan.Code}).", "Plan", plan.Id);
        await _db.SaveChangesAsync(default);
        return ToDto(plan);
    }

    public async Task<PlanDto?> UpdatePlanAsync(Guid id, UpdatePlanRequest request)
    {
        var plan = await _db.Plans.FirstOrDefaultAsync(p => p.Id == id);
        if (plan is null) return null;

        if (!string.IsNullOrWhiteSpace(request.Name)) plan.Name = request.Name.Trim();
        if (request.Description is not null) plan.Description = request.Description.Trim();
        if (request.MonthlyPrice.HasValue)
        {
            if (request.MonthlyPrice.Value < 0) throw AppException.BadRequest("Monthly price cannot be negative.");
            plan.MonthlyPrice = request.MonthlyPrice.Value;
        }
        if (request.YearlyPrice.HasValue)
        {
            if (request.YearlyPrice.Value < 0) throw AppException.BadRequest("Yearly price cannot be negative.");
            plan.YearlyPrice = request.YearlyPrice.Value;
        }
        if (!string.IsNullOrWhiteSpace(request.Currency)) plan.Currency = NormalizeCurrency(request.Currency);
        if (request.MaxUsers.HasValue) plan.MaxUsers = request.MaxUsers.Value == 0 ? null : request.MaxUsers;
        if (request.MaxProjects.HasValue) plan.MaxProjects = request.MaxProjects.Value == 0 ? null : request.MaxProjects;
        if (request.Features is not null) plan.Features = JoinFeatures(request.Features);
        if (request.SortOrder.HasValue) plan.SortOrder = request.SortOrder.Value;

        await _db.SaveChangesAsync(default);
        _audit.Log(ActorId, Guid.Empty, "superadmin.plan.update", $"Updated plan {plan.Name} ({plan.Code}).", "Plan", plan.Id);
        await _db.SaveChangesAsync(default);
        return ToDto(plan);
    }

    public async Task<bool> SetPlanActiveAsync(Guid id, bool isActive)
    {
        var plan = await _db.Plans.FirstOrDefaultAsync(p => p.Id == id);
        if (plan is null) return false;
        plan.IsActive = isActive;
        _audit.Log(ActorId, Guid.Empty, isActive ? "superadmin.plan.activate" : "superadmin.plan.deactivate", $"{(isActive ? "Activated" : "Deactivated")} plan {plan.Name} ({plan.Code}).", "Plan", plan.Id);
        await _db.SaveChangesAsync(default);
        return true;
    }

    // ---------------- Subscriptions ----------------

    public async Task<IReadOnlyList<SubscriptionDto>> ListSubscriptionsAsync()
    {
        var rows = await (
            from s in _db.Subscriptions
            join o in _db.Organizations on s.OrganizationId equals o.Id
            join p in _db.Plans on s.PlanId equals p.Id
            where s.Status != SubscriptionStatus.Cancelled
            orderby o.Name
            select new SubscriptionDto(
                s.Id, o.Id, o.Name, p.Id, p.Name, p.Code,
                s.Status, s.BillingCycle, s.StartedAt, s.CurrentPeriodEnd, s.TrialEndsAt, s.CancelledAt))
            .ToListAsync();
        return rows;
    }

    public async Task<SubscriptionDto?> GetSubscriptionForOrganizationAsync(Guid organizationId)
    {
        return await (
            from s in _db.Subscriptions
            join o in _db.Organizations on s.OrganizationId equals o.Id
            join p in _db.Plans on s.PlanId equals p.Id
            where s.OrganizationId == organizationId && s.Status != SubscriptionStatus.Cancelled
            orderby s.StartedAt descending
            select new SubscriptionDto(
                s.Id, o.Id, o.Name, p.Id, p.Name, p.Code,
                s.Status, s.BillingCycle, s.StartedAt, s.CurrentPeriodEnd, s.TrialEndsAt, s.CancelledAt))
            .FirstOrDefaultAsync();
    }

    public async Task<SubscriptionDto> AssignSubscriptionAsync(Guid organizationId, AssignSubscriptionRequest request)
    {
        var org = await _db.Organizations.FirstOrDefaultAsync(o => o.Id == organizationId)
            ?? throw AppException.BadRequest("Organization not found.");
        var plan = await _db.Plans.FirstOrDefaultAsync(p => p.Id == request.PlanId)
            ?? throw AppException.BadRequest("Plan not found.");
        if (!plan.IsActive) throw AppException.BadRequest("Plan is not active and cannot be assigned.");

        // Cancel any active subscription for this org first (keep history).
        var existing = await _db.Subscriptions
            .Where(s => s.OrganizationId == organizationId && s.Status != SubscriptionStatus.Cancelled)
            .ToListAsync();
        foreach (var e in existing)
        {
            e.Status = SubscriptionStatus.Cancelled;
            e.CancelledAt = DateTime.UtcNow;
        }

        var now = DateTime.UtcNow;
        var trialing = request.TrialEndsAt.HasValue && request.TrialEndsAt.Value > now;
        var periodEnd = request.BillingCycle == BillingCycle.Yearly ? now.AddYears(1) : now.AddMonths(1);

        var sub = new Subscription
        {
            OrganizationId = organizationId,
            PlanId = plan.Id,
            Status = trialing ? SubscriptionStatus.Trialing : SubscriptionStatus.Active,
            BillingCycle = request.BillingCycle,
            StartedAt = now,
            CurrentPeriodEnd = trialing ? request.TrialEndsAt : periodEnd,
            TrialEndsAt = request.TrialEndsAt,
        };
        _db.Subscriptions.Add(sub);
        await _db.SaveChangesAsync(default);

        _audit.Log(ActorId, org.Id, "superadmin.subscription.assign", $"Assigned plan {plan.Name} ({sub.BillingCycle}) to {org.Name}.", "Subscription", sub.Id);
        await _db.SaveChangesAsync(default);

        return new SubscriptionDto(
            sub.Id, org.Id, org.Name, plan.Id, plan.Name, plan.Code,
            sub.Status, sub.BillingCycle, sub.StartedAt, sub.CurrentPeriodEnd, sub.TrialEndsAt, sub.CancelledAt);
    }

    public async Task<bool> CancelSubscriptionAsync(Guid organizationId)
    {
        var existing = await _db.Subscriptions
            .Where(s => s.OrganizationId == organizationId && s.Status != SubscriptionStatus.Cancelled)
            .ToListAsync();
        if (existing.Count == 0) return false;
        foreach (var e in existing)
        {
            e.Status = SubscriptionStatus.Cancelled;
            e.CancelledAt = DateTime.UtcNow;
        }
        _audit.Log(ActorId, organizationId, "superadmin.subscription.cancel", $"Cancelled subscription for organization {organizationId}.", "Subscription", existing.First().Id);
        await _db.SaveChangesAsync(default);
        return true;
    }

    private static PlanDto ToDto(Plan p) => new(
        p.Id, p.Code, p.Name, p.Description, p.MonthlyPrice, p.YearlyPrice, p.Currency,
        p.MaxUsers, p.MaxProjects, SplitFeatures(p.Features), p.IsActive, p.SortOrder, p.CreatedAt);

    private static IReadOnlyList<string> SplitFeatures(string? features)
        => string.IsNullOrWhiteSpace(features)
            ? Array.Empty<string>()
            : features.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    private static string? JoinFeatures(IReadOnlyList<string>? features)
        => features is null || features.Count == 0
            ? null
            : string.Join(',', features.Select(f => f.Trim()).Where(f => f.Length > 0));

    private static string NormalizeCode(string? code)
    {
        var s = (code ?? string.Empty).Trim().ToLowerInvariant();
        var sb = new System.Text.StringBuilder(s.Length);
        foreach (var c in s)
            if (char.IsLetterOrDigit(c) || c == '-' || c == '_') sb.Append(c);
        return sb.ToString();
    }

    private static string NormalizeCurrency(string? currency)
    {
        var s = (currency ?? "USD").Trim().ToUpperInvariant();
        return s.Length == 3 ? s : "USD";
    }
}
