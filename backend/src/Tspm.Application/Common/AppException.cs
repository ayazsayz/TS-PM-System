namespace Tspm.Application.Common;

/// <summary>
/// A business-rule failure that should surface as a 4xx ProblemDetails
/// (e.g. duplicate email, removing the last admin, self-lockout).
/// </summary>
public class AppException : Exception
{
    public int StatusCode { get; }

    public AppException(string message, int statusCode = 400)
        : base(message) => StatusCode = statusCode;

    public static AppException Conflict(string message) => new(message, 409);
    public static AppException BadRequest(string message) => new(message, 400);
}
