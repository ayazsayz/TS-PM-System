namespace Tspm.Application.Clients;

public record ClientDto(
    Guid Id,
    string Name,
    bool IsArchived,
    int ProjectCount);

public record UpsertClientRequest(string Name);

public record SetArchivedRequest(bool IsArchived);
