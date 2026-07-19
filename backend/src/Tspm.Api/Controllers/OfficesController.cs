using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tspm.Application.Attendance;
using Tspm.Infrastructure;

namespace Tspm.Api.Controllers;

[Route("api/offices")]
public class OfficesController : ApiControllerBase
{
    private readonly IOfficeService _offices;

    public OfficesController(IOfficeService offices) => _offices = offices;

    /// <summary>Readable by anyone signed in (the UI labels check-ins with office names).</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OfficeDto>>> List()
        => Ok(await _offices.ListAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OfficeDto>> Get(Guid id)
    {
        var office = await _offices.GetAsync(id);
        return office is null ? NotFound() : Ok(office);
    }

    [HttpPost]
    [Authorize(Policy = Policies.AdminOnly)]
    public async Task<ActionResult<OfficeDto>> Create(UpsertOfficeRequest request)
    {
        var office = await _offices.CreateAsync(request);
        return CreatedAtAction(nameof(Get), new { id = office.Id }, office);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Policies.AdminOnly)]
    public async Task<ActionResult<OfficeDto>> Update(Guid id, UpsertOfficeRequest request)
    {
        var office = await _offices.UpdateAsync(id, request);
        return office is null ? NotFound() : Ok(office);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Policies.AdminOnly)]
    public async Task<IActionResult> Delete(Guid id)
        => await _offices.DeleteAsync(id) ? NoContent() : NotFound();
}
