using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tspm.Application.Dashboard;
using Tspm.Infrastructure;

namespace Tspm.Api.Controllers;

[Route("api/dashboard")]
public class DashboardController : ApiControllerBase
{
    private readonly IDashboardService _dashboard;

    public DashboardController(IDashboardService dashboard) => _dashboard = dashboard;

    [HttpGet("employee")]
    public async Task<ActionResult<EmployeeDashboardDto>> Employee()
        => Ok(await _dashboard.GetEmployeeAsync(UserId));

    [HttpGet("manager")]
    [Authorize(Policy = Policies.ManagerOnly)]
    public async Task<ActionResult<ManagerDashboardDto>> Manager()
        => Ok(await _dashboard.GetManagerAsync());
}
