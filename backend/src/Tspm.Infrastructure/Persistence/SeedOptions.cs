namespace Tspm.Infrastructure.Persistence;

public class SeedOptions
{
    public const string SectionName = "Seed";

    /// <summary>Master switch. When false, nothing is seeded (migrations still run).</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// When true, seeds the full demo dataset (people, clients, projects, timesheets).
    /// When false (the default) only roles and the bootstrap admin are created, so the
    /// workspace starts empty and you enter real data through the app.
    /// </summary>
    public bool DemoData { get; set; }

    /// <summary>Bootstrap administrator — always created so you can never be locked out.</summary>
    public string AdminEmail { get; set; } = "admin@etech.io";
    public string AdminName { get; set; } = "Workspace Admin";
    public string AdminPassword { get; set; } = "Passw0rd!";

    /// <summary>Password used for the demo users (only when <see cref="DemoData"/> is on).</summary>
    public string DemoPassword { get; set; } = "Passw0rd!";

    /// <summary>Platform SuperAdmin — always created so the admin portal can never be locked out.</summary>
    public string SuperAdminEmail { get; set; } = "superadmin@etech.io";
    public string SuperAdminName { get; set; } = "Platform Super Admin";
    public string SuperAdminPassword { get; set; } = "Passw0rd!";
}
