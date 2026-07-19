using Tspm.Domain.Common;

namespace Tspm.Domain.Entities;

/// <summary>
/// A geofenced office location. Check-ins inside <see cref="RadiusMeters"/> of these
/// coordinates are labelled "In office".
/// </summary>
public class Office : Entity, IHasOrganization
{
    public Guid OrganizationId { get; set; }

    public string Name { get; set; } = default!;

    public double Latitude { get; set; }
    public double Longitude { get; set; }

    /// <summary>How close a check-in must be to count as "in office".</summary>
    public int RadiusMeters { get; set; } = 150;

    public bool IsActive { get; set; } = true;
}
