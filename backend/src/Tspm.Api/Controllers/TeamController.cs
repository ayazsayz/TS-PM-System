using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tspm.Application.Team;
using Tspm.Infrastructure;

namespace Tspm.Api.Controllers;

[Route("api/team")]
[Authorize(Policy = Policies.ManagerOnly)]
public class TeamController : ApiControllerBase
{
    private readonly ITeamService _team;

    public TeamController(ITeamService team) => _team = team;

    [HttpGet("utilization")]
    public async Task<ActionResult<IReadOnlyList<UtilizationDto>>> Utilization()
        => Ok(await _team.GetUtilizationAsync());

    [HttpGet("missing")]
    public async Task<ActionResult<IReadOnlyList<MissingTimesheetDto>>> Missing()
        => Ok(await _team.GetMissingAsync());

    [HttpGet("top-performers")]
    public async Task<ActionResult<IReadOnlyList<TopPerformerDto>>> TopPerformers()
        => Ok(await _team.GetTopPerformersAsync());
}
