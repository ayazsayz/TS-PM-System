using Tspm.Domain.Common;
using Tspm.Domain.Enums;

namespace Tspm.Domain.Entities;

public class Project : Entity
{
    public string Name { get; set; } = default!;

    public Guid ClientId { get; set; }
    public Client Client { get; set; } = default!;

    /// <summary>Swatch color (hex) used across the UI.</summary>
    public string ColorHex { get; set; } = "#4757E6";

    public int EstimatedHours { get; set; }
    public decimal Budget { get; set; }

    /// <summary>
    /// Rolled-up lifetime totals. In a real system these are recomputed from
    /// <see cref="TimeEntry"/> history by a background rollup; seeded here to
    /// the demo values so the API returns the numbers the UI expects.
    /// </summary>
    public int ActualHours { get; set; }
    public decimal Spent { get; set; }

    public DateOnly? DueDate { get; set; }
    public ProjectHealth Health { get; set; } = ProjectHealth.OnTrack;
    public int CompletionPct { get; set; }
    public string? WarnNote { get; set; }

    /// <summary>Internal (non-client) buckets like Training &amp; Ops.</summary>
    public bool IsInternal { get; set; }

    public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();
    public ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
}
