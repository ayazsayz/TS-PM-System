using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tspm.Application.Clients;
using Tspm.Infrastructure;

namespace Tspm.Api.Controllers;

[Route("api/clients")]
public class ClientsController : ApiControllerBase
{
    private readonly IClientService _clients;

    public ClientsController(IClientService clients) => _clients = clients;

    /// <summary>Readable by anyone signed in (needed for project pickers).</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ClientDto>>> List(
        [FromQuery] bool includeArchived = false)
        => Ok(await _clients.ListAsync(includeArchived));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClientDto>> Get(Guid id)
    {
        var client = await _clients.GetAsync(id);
        return client is null ? NotFound() : Ok(client);
    }

    [HttpPost]
    [Authorize(Policy = Policies.ManagerOnly)]
    public async Task<ActionResult<ClientDto>> Create(UpsertClientRequest request)
    {
        var client = await _clients.CreateAsync(request);
        return CreatedAtAction(nameof(Get), new { id = client.Id }, client);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Policies.ManagerOnly)]
    public async Task<ActionResult<ClientDto>> Update(Guid id, UpsertClientRequest request)
    {
        var client = await _clients.UpdateAsync(id, request);
        return client is null ? NotFound() : Ok(client);
    }

    [HttpPatch("{id:guid}/archive")]
    [Authorize(Policy = Policies.ManagerOnly)]
    public async Task<ActionResult<ClientDto>> SetArchived(Guid id, SetArchivedRequest request)
    {
        var client = await _clients.SetArchivedAsync(id, request.IsArchived);
        return client is null ? NotFound() : Ok(client);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Policies.ManagerOnly)]
    public async Task<IActionResult> Delete(Guid id)
        => await _clients.DeleteAsync(id) ? NoContent() : NotFound();
}
