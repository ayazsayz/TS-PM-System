using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tspm.Application.Attendance;
using Tspm.Infrastructure;

namespace Tspm.Api.Controllers;

[Route("api/attendance")]
public class AttendanceController : ApiControllerBase
{
    private readonly IAttendanceService _attendance;

    public AttendanceController(IAttendanceService attendance) => _attendance = attendance;

    /// <summary>Today's sessions for the caller. `localDate` is the client's calendar day.</summary>
    [HttpGet("today")]
    public async Task<ActionResult<AttendanceDayDto>> Today([FromQuery] DateOnly localDate)
        => Ok(await _attendance.GetTodayAsync(UserId, localDate));

    [HttpPost("check-in")]
    public async Task<ActionResult<AttendanceDayDto>> CheckIn(CheckInRequest request)
        => Ok(await _attendance.CheckInAsync(UserId, request));

    [HttpPost("check-out")]
    public async Task<ActionResult<AttendanceDayDto>> CheckOut(CheckOutRequest request)
        => Ok(await _attendance.CheckOutAsync(UserId, request));

    [HttpGet("me")]
    public async Task<ActionResult<IReadOnlyList<AttendanceSessionDto>>> Mine(
        [FromQuery] DateOnly from, [FromQuery] DateOnly to)
        => Ok(await _attendance.GetHistoryAsync(UserId, from, to));

    /// <summary>Who's in today, for managers.</summary>
    [HttpGet("team")]
    [Authorize(Policy = Policies.ManagerOnly)]
    public async Task<ActionResult<IReadOnlyList<TeamPresenceDto>>> Team([FromQuery] DateOnly localDate)
        => Ok(await _attendance.GetTeamPresenceAsync(localDate));
}
