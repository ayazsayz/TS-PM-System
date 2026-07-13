using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tspm.Application.Approvals;
using Tspm.Infrastructure;

namespace Tspm.Api.Controllers;

[Route("api/approvals")]
[Authorize(Policy = Policies.ManagerOnly)]
public class ApprovalsController : ApiControllerBase
{
    private readonly IApprovalService _approvals;

    public ApprovalsController(IApprovalService approvals) => _approvals = approvals;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ApprovalDto>>> Get([FromQuery] string? status)
        => Ok(await _approvals.GetAsync(status));

    [HttpPost("{id:guid}/approve")]
    public async Task<ActionResult<ApprovalDto>> Approve(Guid id)
    {
        var result = await _approvals.DecideAsync(id, UserId, approve: true, comment: null);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{id:guid}/reject")]
    public async Task<ActionResult<ApprovalDto>> Reject(Guid id, RejectRequest request)
    {
        var result = await _approvals.DecideAsync(id, UserId, approve: false, comment: request.Comment);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("bulk-approve")]
    public async Task<ActionResult<object>> BulkApprove(BulkApproveRequest request)
    {
        var count = await _approvals.BulkApproveAsync(request.Ids, UserId);
        return Ok(new { approved = count });
    }

    [HttpGet("history")]
    public async Task<ActionResult<IReadOnlyList<ApprovalHistoryDto>>> History()
        => Ok(await _approvals.GetHistoryAsync());
}
