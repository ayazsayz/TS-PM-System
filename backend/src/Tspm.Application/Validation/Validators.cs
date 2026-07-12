using FluentValidation;
using Tspm.Application.Auth;
using Tspm.Application.Tasks;
using Tspm.Application.TimeEntries;

namespace Tspm.Application.Validation;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
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
