using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tspm.Application.Projects;
using Tspm.Infrastructure;

namespace Tspm.Api.Controllers;

[Route("api/projects")]
public class ProjectsController : ApiControllerBase
{
    private readonly IProjectService _projects;

    public ProjectsController(IProjectService projects) => _projects = projects;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProjectDto>>> GetAll(
        [FromQuery] string? filter, [FromQuery] bool includeArchived = false)
        => Ok(await _projects.GetAllAsync(filter, includeArchived));

    [HttpGet("mine")]
    public async Task<ActionResult<IReadOnlyList<MyProjectDto>>> GetMine()
        => Ok(await _projects.GetMineAsync(UserId));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProjectDto>> GetById(Guid id)
    {
        var project = await _projects.GetByIdAsync(id);
        return project is null ? NotFound() : Ok(project);
    }

    [HttpPost]
    [Authorize(Policy = Policies.ManagerOnly)]
    public async Task<ActionResult<ProjectDto>> Create(UpsertProjectRequest request)
    {
        var project = await _projects.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = project.Id }, project);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Policies.ManagerOnly)]
    public async Task<ActionResult<ProjectDto>> Update(Guid id, UpsertProjectRequest request)
    {
        var project = await _projects.UpdateAsync(id, request);
        return project is null ? NotFound() : Ok(project);
    }

    [HttpPatch("{id:guid}/archive")]
    [Authorize(Policy = Policies.ManagerOnly)]
    public async Task<ActionResult<ProjectDto>> SetArchived(Guid id, SetProjectArchivedRequest request)
    {
        var project = await _projects.SetArchivedAsync(id, request.IsArchived);
        return project is null ? NotFound() : Ok(project);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Policies.ManagerOnly)]
    public async Task<IActionResult> Delete(Guid id)
        => await _projects.DeleteAsync(id) ? NoContent() : NotFound();
}
