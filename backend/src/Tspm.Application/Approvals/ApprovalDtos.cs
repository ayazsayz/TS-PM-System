namespace Tspm.Application.Approvals;

public record ApprovalDto(
    Guid Id,
    Guid UserId,
    string Name,
    string Initials,
    string Department,
    string AvatarColor,
    string Week,
    decimal Hours,
    int BillablePercent,
    string Status,
    string? Submitted,
    string? Flag,
    bool IsPending);

public record ApprovalHistoryDto(
    string Action,
    string Message,
    string Timestamp);

public record RejectRequest(string? Comment);

public record BulkApproveRequest(IReadOnlyList<Guid> Ids);
