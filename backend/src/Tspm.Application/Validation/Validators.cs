using FluentValidation;
using Tspm.Application.Admin;
using Tspm.Application.Auth;
using Tspm.Application.Clients;
using Tspm.Application.Projects;
using Tspm.Application.Tasks;
using Tspm.Application.TimeEntries;

namespace Tspm.Application.Validation;

public class UpsertClientRequestValidator : AbstractValidator<UpsertClientRequest>
{
    public UpsertClientRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
    }
}

public class UpsertProjectRequestValidator : AbstractValidator<UpsertProjectRequest>
{
    public UpsertProjectRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(160);
        RuleFor(x => x.ClientId).NotEmpty().WithMessage("A client is required.");
        RuleFor(x => x.EstimatedHours).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Budget).GreaterThanOrEqualTo(0);
        RuleFor(x => x.HourlyRate).GreaterThanOrEqualTo(0);
        RuleFor(x => x.CompletionPct).InclusiveBetween(0, 100);
        RuleFor(x => x.Warn).MaximumLength(256);
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty();
        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .Matches("[A-Z]").WithMessage("Password must contain an uppercase letter.")
            .Matches("[a-z]").WithMessage("Password must contain a lowercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain a digit.")
            .NotEqual(x => x.CurrentPassword).WithMessage("New password must differ from the current one.");
    }
}

public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Title).MaximumLength(80);
        RuleFor(x => x.Department).MaximumLength(80);
    }
}

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Title).MaximumLength(80);
        RuleFor(x => x.Department).MaximumLength(80);
    }
}

public class UpsertTimeEntryRequestValidator : AbstractValidator<UpsertTimeEntryRequest>
{
    public UpsertTimeEntryRequestValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.Task).MaximumLength(160);
        RuleFor(x => x.Description).MaximumLength(512);
        RuleFor(x => x.Hours).InclusiveBetween(0, 24);
    }
}

public class CreateTaskRequestValidator : AbstractValidator<CreateTaskRequest>
{
    public CreateTaskRequestValidator()
    {
        RuleFor(x => x.Label).NotEmpty().MaximumLength(200);
    }
}

public class UpdateTaskRequestValidator : AbstractValidator<UpdateTaskRequest>
{
    public UpdateTaskRequestValidator()
    {
        RuleFor(x => x.Label).NotEmpty().MaximumLength(200);
    }
}
