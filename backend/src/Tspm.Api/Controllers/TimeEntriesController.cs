using Microsoft.AspNetCore.Mvc;
using Tspm.Application.TimeEntries;

namespace Tspm.Api.Controllers;

[Route("api/time-entries")]
public class TimeEntriesController : ApiControllerBase
{
    private readonly ITimeEntryService _entries;

    public TimeEntriesController(ITimeEntryService entries) => _entries = entries;

    /// <summary>Entries for a single day (?date=) or a week (?weekStart=).</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TimeEntryDto>>> Get(
        [FromQuery] DateOnly? date, [FromQuery] DateOnly? weekStart)
    {
        if (date is { } d) return Ok(await _entries.GetByDateAsync(UserId, d));
        if (weekStart is { } w) return Ok(await _entries.GetByWeekAsync(UserId, w));
        return BadRequest(new { message = "Provide either 'date' or 'weekStart'." });
    }

    [HttpPost]
    public async Task<ActionResult<TimeEntryDto>> Create(UpsertTimeEntryRequest request)
        => Ok(await _entries.CreateAsync(UserId, request));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TimeEntryDto>> Update(Guid id, UpsertTimeEntryRequest request)
    {
        var entry = await _entries.UpdateAsync(UserId, id, request);
        return entry is null ? NotFound() : Ok(entry);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
        => await _entries.DeleteAsync(UserId, id) ? NoContent() : NotFound();

    [HttpPost("duplicate")]
    public async Task<ActionResult<object>> Duplicate(DuplicateDayRequest request)
    {
        var count = await _entries.DuplicateDayAsync(UserId, request);
        return Ok(new { copied = count });
    }
}
