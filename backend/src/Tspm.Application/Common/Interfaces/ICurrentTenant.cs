namespace Tspm.Application.Common.Interfaces;

/// <summary>
/// The organization the current request is acting within, read from the JWT's
/// <c>org</c> claim. Null when unauthenticated or during system/design-time work.
/// </summary>
public interface ICurrentTenant
{
    Guid? OrganizationId { get; }
}
