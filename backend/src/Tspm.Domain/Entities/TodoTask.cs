using Tspm.Domain.Common;

namespace Tspm.Domain.Entities;

/// <summary>An item in the dashboard "My tasks" checklist.</summary>
public class TodoTask : Entity
{
    public Guid UserId { get; set; }

    public Guid? ProjectId { get; set; }
    public Project? Project { get; set; }

    public string Label { get; set; } = string.Empty;
    public bool IsDone { get; set; }

    /// <summary>Human due label, e.g. "Today", "Mon", "Jul 8".</summary>
    public string? DueLabel { get; set; }
    public bool IsUrgent { get; set; }
}
