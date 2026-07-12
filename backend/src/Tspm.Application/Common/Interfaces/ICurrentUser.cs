namespace Tspm.Application.Common.Interfaces;

/// <summary>Ambient accessor for the authenticated request's user.</summary>
public interface ICurrentUser
{
    Guid? Id { get; }
    bool IsAuthenticated { get; }
    IReadOnlyList<string> Roles { get; }
    bool IsManager { get; }
}
