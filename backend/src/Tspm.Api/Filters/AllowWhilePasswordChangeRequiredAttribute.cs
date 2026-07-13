namespace Tspm.Api.Filters;

/// <summary>
/// Marks an endpoint as reachable while the caller is still on a one-time password
/// (i.e. their token carries the must_change_password claim). Everything else is 403'd
/// by <see cref="MustChangePasswordFilter"/>.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class AllowWhilePasswordChangeRequiredAttribute : Attribute;
