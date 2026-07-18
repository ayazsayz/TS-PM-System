using Tspm.Domain.Common;

namespace Tspm.Domain.Entities;

/// <summary>A tenant. Each organization owns its own users, clients, projects and time.</summary>
public class Organization : Entity
{
    public string Name { get; set; } = default!;

    /// <summary>URL-safe unique identifier (display / future subdomains).</summary>
    public string Slug { get; set; } = default!;

    public bool IsActive { get; set; } = true;
}
