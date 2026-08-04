using Tspm.Domain.Common;

namespace Tspm.Infrastructure.Identity;

/// <summary>Infrastructure-facing alias of the canonical <see cref="AppRoles"/>.</summary>
public static class Roles
{
    public const string Employee = AppRoles.Employee;
    public const string Manager = AppRoles.Manager;
    public const string Admin = AppRoles.Admin;
    public const string SuperAdmin = AppRoles.SuperAdmin;

    public static readonly string[] All = AppRoles.All;
}
