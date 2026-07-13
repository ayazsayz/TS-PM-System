using Microsoft.AspNetCore.Identity;
using Microsoft.OpenApi;
using Serilog;
using Tspm.Api.Auth;
using Tspm.Api.ExceptionHandlers;
using Tspm.Api.Filters;
using Tspm.Application;
using Tspm.Application.Common.Interfaces;
using Tspm.Infrastructure;
using Tspm.Infrastructure.Identity;
using Tspm.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((ctx, cfg) => cfg.ReadFrom.Configuration(ctx.Configuration)
    .WriteTo.Console());

// ---- Services ----
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddAuth(builder.Configuration);
builder.Services.AddApplication();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();

builder.Services.AddControllers(o =>
{
    o.Filters.Add<ValidationFilter>();
    o.Filters.Add<MustChangePasswordFilter>();
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<AppExceptionHandler>();

const string CorsPolicy = "Frontend";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173", "http://localhost:5174"];
builder.Services.AddCors(o => o.AddPolicy(CorsPolicy, p =>
    p.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

builder.Services.AddSwaggerGen(o =>
{
    o.SwaggerDoc("v1", new OpenApiInfo { Title = "Tspm API", Version = "v1" });
    o.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste the JWT access token returned by POST /api/auth/login.",
    });
    o.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        { new OpenApiSecuritySchemeReference("Bearer", null), new List<string>() },
    });
});

var app = builder.Build();

// ---- Startup seeding (guarded: only when a DB is configured) ----
await SeedAsync(app);

// ---- Pipeline ----
app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseSerilogRequestLogging();
app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
return;

static async Task SeedAsync(WebApplication app)
{
    var connectionString = app.Configuration.GetConnectionString("DefaultConnection");
    var seedEnabled = app.Configuration.GetValue("Seed:Enabled", true);
    if (string.IsNullOrWhiteSpace(connectionString) || !seedEnabled)
    {
        app.Logger.LogWarning("Seeding skipped: no connection string configured or seeding disabled.");
        return;
    }

    using var scope = app.Services.CreateScope();
    var sp = scope.ServiceProvider;
    try
    {
        var db = sp.GetRequiredService<AppDbContext>();
        var users = sp.GetRequiredService<UserManager<ApplicationUser>>();
        var roles = sp.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var demoPassword = app.Configuration.GetValue("Seed:DemoPassword", "Passw0rd!")!;
        await DbInitializer.SeedAsync(db, users, roles, demoPassword);
        app.Logger.LogInformation("Database migrated and seeded.");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Database seeding failed. Verify the connection string and that SQL Server is reachable.");
    }
}

/// <summary>Exposed for integration tests (WebApplicationFactory).</summary>
public partial class Program;
