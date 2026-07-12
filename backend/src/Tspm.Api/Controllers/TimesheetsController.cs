using Microsoft.AspNetCore.Mvc;
using Tspm.Application.Timesheets;

namespace Tspm.Api.Controllers;

[Route("api/timesheets")]
public class TimesheetsController : ApiControllerBase
{
    private readonly ITimesheetService _timesheets;

    public TimesheetsController(ITimesheetService timesheets) => _timesheets = timesheets;

    /// <summary>The weekly grid (built from the user's entries) for a given week.</summary>
    [HttpGet]
    public async Task<ActionResult<WeeklyTimesheetDto>> GetWeek([FromQuery] DateOnly weekStart)
        => Ok(await _timesheets.GetWeekAsync(UserId, weekStart));

    [HttpPost("submit")]
    public async Task<ActionResult<WeeklyTimesheetDto>> Submit([FromQuery] DateOnly weekStart)
        => Ok(await _timesheets.SubmitAsync(UserId, weekStart));
}
