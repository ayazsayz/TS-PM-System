using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Tspm.Application.Common;

namespace Tspm.Api.ExceptionHandlers;

/// <summary>Maps <see cref="AppException"/> (business-rule failures) to 4xx ProblemDetails.</summary>
public class AppExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (exception is not AppException appException) return false;

        var problem = new ProblemDetails
        {
            Status = appException.StatusCode,
            Title = appException.StatusCode == StatusCodes.Status409Conflict ? "Conflict" : "Request failed",
            Detail = appException.Message,
        };

        httpContext.Response.StatusCode = appException.StatusCode;
        await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken);
        return true;
    }
}
