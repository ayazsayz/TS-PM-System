namespace Tspm.Application.Tasks;

public record TaskDto(
    Guid Id,
    string Label,
    bool Done,
    string? Due,
    bool Urgent,
    Guid? ProjectId,
    string? ProjectName,
    string? ProjectColor);

public record CreateTaskRequest(string Label, Guid? ProjectId, string? Due, bool Urgent);

public record UpdateTaskRequest(string Label, string? Due, bool Urgent, bool Done);
