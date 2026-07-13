using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Tspm.Application.Common.Interfaces;

namespace Tspm.Api.Filters;

/// <summary>
/// Enforces the forced password change: a token carrying the must_change_password claim
/// may only reach endpoints marked <see cref="AllowWhilePasswordChangeRequiredAttribute"/>.
/// This is what stops a user from skipping the change and using the app on a one-time password.
/// </summary>
public class MustChangePasswordFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var user = context.HttpContext.User;
        var restricted = user.Identity?.IsAuthenticated == true &&
                         user.HasClaim(ITokenService.MustChangePasswordClaim, "true");

        if (restricted)
        {
            var allowed = context.ActionDescriptor.EndpointMetadata
                .OfType<AllowWhilePasswordChangeRequiredAttribute>()
                .Any();

            if (!allowed)
            {
                context.Result = new ObjectResult(new ProblemDetails
                {
                    Status = StatusCodes.Status403Forbidden,
                    Title = "Password change required",
                    Detail = "You must change your one-time password before using the application.",
                })
                {
                    StatusCode = StatusCodes.Status403Forbidden,
                };
                return;
            }
        }

        await next();
    }
}
