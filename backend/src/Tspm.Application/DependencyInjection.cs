using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Tspm.Application.Approvals;
using Tspm.Application.Clients;
using Tspm.Application.Dashboard;
using Tspm.Application.Notifications;
using Tspm.Application.Projects;
using Tspm.Application.Reports;
using Tspm.Application.Tasks;
using Tspm.Application.Team;
using Tspm.Application.TimeEntries;
using Tspm.Application.Timesheets;

namespace Tspm.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<IClientService, ClientService>();
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<ITimeEntryService, TimeEntryService>();
        services.AddScoped<ITimesheetService, TimesheetService>();
        services.AddScoped<IApprovalService, ApprovalService>();
        services.AddScoped<ITeamService, TeamService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<INotificationService, NotificationService>();

        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        return services;
    }
}
