using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Tspm.Infrastructure.Persistence;

/// <summary>
/// Used only by the EF Core CLI (`dotnet ef migrations add …`). A syntactically
/// valid connection string is enough to build the model; no DB connection is
/// made when generating migrations. Applying migrations uses the real
/// connection string from configuration/user-secrets.
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer("Server=(localdb)\\MSSQLLocalDB;Database=Tspm_DesignTime;Trusted_Connection=True;TrustServerCertificate=True")
            .Options;
        return new AppDbContext(options);
    }
}
