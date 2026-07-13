namespace Tspm.Domain.Common;

/// <summary>Canonical role names, shared by all layers.</summary>
public static class AppRoles
{
    public const string Employee = "Employee";
    public const string Manager = "Manager";
    public const string Admin = "Admin";

    public static readonly string[] All = [Employee, Manager, Admin];
}
