namespace Tspm.Application.SuperAdmin;

public record SuperAdminOrganizationDto(
    Guid Id,
    string Name,
    string Slug,
    bool IsActive,
    DateTime CreatedAt);

public record CreateOrganizationRequest(string Name, string Slug);

public record UpdateOrganizationRequest(string? Name, string? Slug);
