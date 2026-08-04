namespace Tspm.Application.SuperAdmin;

public interface ISuperAdminImpersonationService
{
    /// <summary>Issues a short-lived access token for the target user. No refresh token is issued.</summary>
    Task<ImpersonationResponse?> ImpersonateAsync(Guid targetUserId, Guid actingSuperAdminId, string actingSuperAdminEmail);
}
