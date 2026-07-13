using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tspm.Application.Reports;
using Tspm.Infrastructure;

namespace Tspm.Api.Controllers;

[Route("api/reports")]
[Authorize(Policy = Policies.ManagerOnly)]
public class ReportsController : ApiControllerBase
{
    private readonly IReportService _reports;

    public ReportsController(IReportService reports) => _reports = reports;

    [HttpGet("summary")]
    public async Task<ActionResult<ReportsSummaryDto>> Summary()
        => Ok(await _reports.GetSummaryAsync());
}
