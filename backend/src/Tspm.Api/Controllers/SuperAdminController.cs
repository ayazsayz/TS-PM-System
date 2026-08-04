using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tspm.Application.SuperAdmin;
using Tspm.Infrastructure;

namespace Tspm.Api.Controllers;

[Route("api/superadmin")]
[Authorize(Policy = Policies.SuperAdminOnly)]
public class SuperAdminController : ApiControllerBase
{
    private readonly ISuperAdminService _superAdmin;
    private readonly ISuperAdminUserService _users;
    private readonly ISuperAdminAuditService _audit;
    private readonly ISuperAdminImpersonationService _impersonation;

    public SuperAdminController(
        ISuperAdminService superAdmin,
        ISuperAdminUserService users,
        ISuperAdminAuditService audit,
        ISuperAdminImpersonationService impersonation)
    {
        _superAdmin = superAdmin;
        _users = users;
        _audit = audit;
        _impersonation = impersonation;
    }

    [HttpGet("organizations")]
    public async Task<ActionResult<IReadOnlyList<SuperAdminOrganizationDto>>> ListOrganizations()
        => Ok(await _superAdmin.ListOrganizationsAsync());

    [HttpGet("organizations/{id:guid}")]
    public async Task<ActionResult<SuperAdminOrganizationDto>> GetOrganization(Guid id)
    {
        var org = await _superAdmin.GetOrganizationAsync(id);
        return org is null ? NotFound() : Ok(org);
    }

    [HttpPost("organizations")]
    public async Task<ActionResult<SuperAdminOrganizationDto>> CreateOrganization(CreateOrganizationRequest request)
    {
        var org = await _superAdmin.CreateOrganizationAsync(request);
        return CreatedAtAction(nameof(GetOrganization), new { id = org.Id }, org);
    }

    [HttpPatch("organizations/{id:guid}")]
    public async Task<ActionResult<SuperAdminOrganizationDto>> UpdateOrganization(Guid id, UpdateOrganizationRequest request)
    {
        var org = await _superAdmin.UpdateOrganizationAsync(id, request);
        return org is null ? NotFound() : Ok(org);
    }

    [HttpPost("organizations/{id:guid}/suspend")]
    public async Task<IActionResult> Suspend(Guid id)
        => await _superAdmin.SetActiveAsync(id, false) ? NoContent() : NotFound();

    [HttpPost("organizations/{id:guid}/activate")]
    public async Task<IActionResult> Activate(Guid id)
        => await _superAdmin.SetActiveAsync(id, true) ? NoContent() : NotFound();

    // ---------------- Plans ----------------

    [HttpGet("plans")]
    public async Task<ActionResult<IReadOnlyList<PlanDto>>> ListPlans([FromQuery] bool includeInactive = false)
        => Ok(await _superAdmin.ListPlansAsync(includeInactive));

    [HttpGet("plans/{id:guid}")]
    public async Task<ActionResult<PlanDto>> GetPlan(Guid id)
    {
        var plan = await _superAdmin.GetPlanAsync(id);
        return plan is null ? NotFound() : Ok(plan);
    }

    [HttpPost("plans")]
    public async Task<ActionResult<PlanDto>> CreatePlan(CreatePlanRequest request)
    {
        var plan = await _superAdmin.CreatePlanAsync(request);
        return CreatedAtAction(nameof(GetPlan), new { id = plan.Id }, plan);
    }

    [HttpPatch("plans/{id:guid}")]
    public async Task<ActionResult<PlanDto>> UpdatePlan(Guid id, UpdatePlanRequest request)
    {
        var plan = await _superAdmin.UpdatePlanAsync(id, request);
        return plan is null ? NotFound() : Ok(plan);
    }

    [HttpPost("plans/{id:guid}/activate")]
    public async Task<IActionResult> ActivatePlan(Guid id)
        => await _superAdmin.SetPlanActiveAsync(id, true) ? NoContent() : NotFound();

    [HttpPost("plans/{id:guid}/deactivate")]
    public async Task<IActionResult> DeactivatePlan(Guid id)
        => await _superAdmin.SetPlanActiveAsync(id, false) ? NoContent() : NotFound();

    // ---------------- Subscriptions ----------------

    [HttpGet("subscriptions")]
    public async Task<ActionResult<IReadOnlyList<SubscriptionDto>>> ListSubscriptions()
        => Ok(await _superAdmin.ListSubscriptionsAsync());

    [HttpGet("organizations/{id:guid}/subscription")]
    public async Task<ActionResult<SubscriptionDto>> GetSubscription(Guid id)
    {
        var sub = await _superAdmin.GetSubscriptionForOrganizationAsync(id);
        return sub is null ? NotFound() : Ok(sub);
    }

    [HttpPost("organizations/{id:guid}/subscription")]
    public async Task<ActionResult<SubscriptionDto>> AssignSubscription(Guid id, AssignSubscriptionRequest request)
        => Ok(await _superAdmin.AssignSubscriptionAsync(id, request));

    [HttpDelete("organizations/{id:guid}/subscription")]
    public async Task<IActionResult> CancelSubscription(Guid id)
        => await _superAdmin.CancelSubscriptionAsync(id) ? NoContent() : NotFound();

    // ---------------- Users ----------------

    [HttpGet("users")]
    public async Task<ActionResult<IReadOnlyList<SuperAdminUserDto>>> ListUsers(
        [FromQuery] string? search,
        [FromQuery] Guid? organizationId,
        [FromQuery] string? role,
        [FromQuery] string? status)
        => Ok(await _users.ListAsync(search, organizationId, role, status));

    [HttpGet("users/{id:guid}")]
    public async Task<ActionResult<SuperAdminUserDto>> GetUser(Guid id)
    {
        var user = await _users.GetAsync(id);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPost("users/{id:guid}/activate")]
    public async Task<ActionResult<SuperAdminUserDto>> ActivateUser(Guid id)
    {
        var user = await _users.SetActiveAsync(id, true, UserId);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPost("users/{id:guid}/deactivate")]
    public async Task<ActionResult<SuperAdminUserDto>> DeactivateUser(Guid id)
    {
        var user = await _users.SetActiveAsync(id, false, UserId);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPut("users/{id:guid}/roles")]
    public async Task<ActionResult<SuperAdminUserDto>> SetUserRoles(Guid id, UpdateSuperAdminUserRolesRequest request)
    {
        var user = await _users.SetRolesAsync(id, request.Roles, UserId);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPost("users/{id:guid}/reset-password")]
    public async Task<ActionResult<SuperAdminResetPasswordResponse>> ResetUserPassword(Guid id)
    {
        var otp = await _users.ResetPasswordAsync(id, UserId);
        return otp is null ? NotFound() : Ok(new SuperAdminResetPasswordResponse(otp));
    }

    [HttpPost("users/{id:guid}/impersonate")]
    public async Task<ActionResult<ImpersonationResponse>> ImpersonateUser(Guid id)
    {
        var actingEmail = User.FindFirstValue(ClaimTypes.Email)
            ?? User.FindFirstValue("email")
            ?? "superadmin";
        var response = await _impersonation.ImpersonateAsync(id, UserId, actingEmail);
        return response is null ? NotFound() : Ok(response);
    }

    // ---------------- Audit log ----------------

    [HttpGet("audit")]
    public async Task<ActionResult<IReadOnlyList<AuditLogDto>>> ListAudit(
        [FromQuery] string? search,
        [FromQuery] Guid? organizationId,
        [FromQuery] Guid? actorId,
        [FromQuery] string? action,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int? take)
        => Ok(await _audit.QueryAsync(new AuditLogQuery(search, organizationId, actorId, action, from, to, take)));

    [HttpGet("audit/actions")]
    public async Task<ActionResult<IReadOnlyList<string>>> ListAuditActions()
        => Ok(await _audit.ListActionsAsync());
}
