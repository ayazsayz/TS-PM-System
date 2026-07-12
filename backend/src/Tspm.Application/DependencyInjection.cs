using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Tspm.Application.Projects;
using Tspm.Application.Tasks;
using Tspm.Application.TimeEntries;
using Tspm.Application.Timesheets;

namespace Tspm.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<ITimeEntryService, TimeEntryService>();
        services.AddScoped<ITimesheetService, TimesheetService>();

        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        return services;
    }
}
