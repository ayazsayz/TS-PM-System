using Tspm.Domain.Common;

namespace Tspm.Domain.Entities;

/// <summary>Join row: a user assigned to a project (the team avatars).</summary>
public class ProjectMember : IHasOrganization
{
    public Guid OrganizationId { get; set; }

    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public Guid UserId { get; set; }
}
