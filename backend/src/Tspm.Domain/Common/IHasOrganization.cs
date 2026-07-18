namespace Tspm.Domain.Common;

/// <summary>
/// Marks an entity as belonging to a tenant organization. The DbContext uses this
/// to apply a global query filter (scoping every read) and to stamp new rows with
/// the current tenant on save.
/// </summary>
public interface IHasOrganization
{
    Guid OrganizationId { get; set; }
}
