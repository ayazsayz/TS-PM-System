using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Tspm.Application.Common.Interfaces;
using Tspm.Infrastructure.Identity;
using Tspm.Infrastructure.Persistence;

namespace Tspm.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration config)
    {
        var connectionString = config.GetConnectionString("DefaultConnection");
        services.AddDbContext<AppDbContext>(o => o.UseSqlServer(connectionString));
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddScoped<IUserDirectory, UserDirectory>();
        services.AddScoped<IUserAdminService, UserAdminService>();
        services.AddScoped<Tspm.Application.SuperAdmin.ISuperAdminUserService, SuperAdminUserService>();
        services.AddScoped<Tspm.Application.SuperAdmin.ISuperAdminAuditService, SuperAdminAuditService>();
        services.AddScoped<Tspm.Application.SuperAdmin.ISuperAdminImpersonationService, SuperAdminImpersonationService>();
        services.AddScoped<IAuditLogger, AuditLogger>();

        services
            .AddIdentityCore<ApplicationUser>(o =>
            {
                o.Password.RequiredLength = 8;
                o.Password.RequireNonAlphanumeric = false;
                o.User.RequireUniqueEmail = true;
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<AppDbContext>();

        // JWT auth + token/user services are registered in AddAuth (B3).
        return services;
    }
}
