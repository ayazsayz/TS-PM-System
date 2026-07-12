using Microsoft.AspNetCore.Mvc;
using Tspm.Application.Tasks;

namespace Tspm.Api.Controllers;

[Route("api/tasks")]
public class TasksController : ApiControllerBase
{
    private readonly ITaskService _tasks;

    public TasksController(ITaskService tasks) => _tasks = tasks;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TaskDto>>> Get()
        => Ok(await _tasks.GetForUserAsync(UserId));

    [HttpPost]
    public async Task<ActionResult<TaskDto>> Create(CreateTaskRequest request)
        => Ok(await _tasks.CreateAsync(UserId, request));

    [HttpPatch("{id:guid}/toggle")]
    public async Task<ActionResult<TaskDto>> Toggle(Guid id)
    {
        var task = await _tasks.ToggleAsync(UserId, id);
        return task is null ? NotFound() : Ok(task);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TaskDto>> Update(Guid id, UpdateTaskRequest request)
    {
        var task = await _tasks.UpdateAsync(UserId, id, request);
        return task is null ? NotFound() : Ok(task);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
        => await _tasks.DeleteAsync(UserId, id) ? NoContent() : NotFound();
}
