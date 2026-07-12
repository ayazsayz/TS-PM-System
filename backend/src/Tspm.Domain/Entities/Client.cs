using Tspm.Domain.Common;

namespace Tspm.Domain.Entities;

public class Client : Entity
{
    public string Name { get; set; } = default!;

    public ICollection<Project> Projects { get; set; } = new List<Project>();
}
