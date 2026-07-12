using Microsoft.AspNetCore.Mvc;
using Tspm.Application.Projects;

namespace Tspm.Api.Controllers;

[Route("api/projects")]
public class ProjectsController : ApiControllerBase
{
    private readonly IProjectService _projects;

    public ProjectsController(IProjectService projects) => _projects = projects;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProjectDto>>> GetAll([FromQuery] string? filter)
        => Ok(await _projects.GetAllAsync(filter));

    [HttpGet("mine")]
    public async Task<ActionResult<IReadOnlyList<MyProjectDto>>> GetMine()
        => Ok(await _projects.GetMineAsync(UserId));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProjectDto>> GetById(Guid id)
    {
        var project = await _projects.GetByIdAsync(id);
        return project is null ? NotFound() : Ok(project);
    }
}
