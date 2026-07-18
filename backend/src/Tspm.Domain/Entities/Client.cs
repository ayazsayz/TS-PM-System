using Tspm.Domain.Common;

namespace Tspm.Domain.Entities;

public class Client : Entity, IHasOrganization
{
    public Guid OrganizationId { get; set; }

    public string Name { get; set; } = default!;

    /// <summary>Archived clients are hidden from pickers but keep their history.</summary>
    public bool IsArchived { get; set; }

    public ICollection<Project> Projects { get; set; } = new List<Project>();
}
