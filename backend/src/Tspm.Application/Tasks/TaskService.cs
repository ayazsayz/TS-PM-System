using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common.Interfaces;
using Tspm.Domain.Entities;

namespace Tspm.Application.Tasks;

public interface ITaskService
{
    Task<IReadOnlyList<TaskDto>> GetForUserAsync(Guid userId);
    Task<TaskDto> CreateAsync(Guid userId, CreateTaskRequest req);
    Task<TaskDto?> ToggleAsync(Guid userId, Guid id);
    Task<TaskDto?> UpdateAsync(Guid userId, Guid id, UpdateTaskRequest req);
    Task<bool> DeleteAsync(Guid userId, Guid id);
}

public class TaskService : ITaskService
{
    private readonly IAppDbContext _db;

    public TaskService(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<TaskDto>> GetForUserAsync(Guid userId)
    {
        var tasks = await _db.TodoTasks
            .AsNoTracking()
            .Include(t => t.Project)
            .Where(t => t.UserId == userId)
            .OrderBy(t => t.IsDone)
            .ToListAsync();
        return tasks.Select(Map).ToList();
    }

    public async Task<TaskDto> CreateAsync(Guid userId, CreateTaskRequest req)
    {
        var task = new TodoTask
        {
            UserId = userId,
            Label = req.Label,
            ProjectId = req.ProjectId,
            DueLabel = req.Due,
            IsUrgent = req.Urgent,
        };
        _db.TodoTasks.Add(task);
        await _db.SaveChangesAsync();
        return await ReloadAsync(task.Id) ?? Map(task);
    }

    public async Task<TaskDto?> ToggleAsync(Guid userId, Guid id)
    {
        var task = await _db.TodoTasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (task is null) return null;
        task.IsDone = !task.IsDone;
        await _db.SaveChangesAsync();
        return await ReloadAsync(id);
    }

    public async Task<TaskDto?> UpdateAsync(Guid userId, Guid id, UpdateTaskRequest req)
    {
        var task = await _db.TodoTasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (task is null) return null;
        task.Label = req.Label;
        task.DueLabel = req.Due;
        task.IsUrgent = req.Urgent;
        task.IsDone = req.Done;
        await _db.SaveChangesAsync();
        return await ReloadAsync(id);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid id)
    {
        var task = await _db.TodoTasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (task is null) return false;
        _db.TodoTasks.Remove(task);
        await _db.SaveChangesAsync();
        return true;
    }

    private async Task<TaskDto?> ReloadAsync(Guid id)
    {
        var task = await _db.TodoTasks.AsNoTracking().Include(t => t.Project).FirstOrDefaultAsync(t => t.Id == id);
        return task is null ? null : Map(task);
    }

    private static TaskDto Map(TodoTask t) => new(
        t.Id, t.Label, t.IsDone, t.DueLabel, t.IsUrgent,
        t.ProjectId, t.Project?.Name, t.Project?.ColorHex);
}
