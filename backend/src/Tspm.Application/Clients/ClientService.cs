using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common;
using Tspm.Application.Common.Interfaces;
using Tspm.Domain.Entities;

namespace Tspm.Application.Clients;

public interface IClientService
{
    Task<IReadOnlyList<ClientDto>> ListAsync(bool includeArchived);
    Task<ClientDto?> GetAsync(Guid id);
    Task<ClientDto> CreateAsync(UpsertClientRequest request);
    Task<ClientDto?> UpdateAsync(Guid id, UpsertClientRequest request);
    Task<ClientDto?> SetArchivedAsync(Guid id, bool archived);
    Task<bool> DeleteAsync(Guid id);
}

public class ClientService : IClientService
{
    private readonly IAppDbContext _db;

    public ClientService(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<ClientDto>> ListAsync(bool includeArchived)
    {
        var query = _db.Clients.AsNoTracking();
        if (!includeArchived) query = query.Where(c => !c.IsArchived);

        return await query
            .OrderBy(c => c.Name)
            .Select(c => new ClientDto(c.Id, c.Name, c.IsArchived, c.Projects.Count))
            .ToListAsync();
    }

    public async Task<ClientDto?> GetAsync(Guid id) =>
        await _db.Clients.AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new ClientDto(c.Id, c.Name, c.IsArchived, c.Projects.Count))
            .FirstOrDefaultAsync();

    public async Task<ClientDto> CreateAsync(UpsertClientRequest request)
    {
        var name = request.Name.Trim();
        if (await _db.Clients.AnyAsync(c => c.Name == name))
            throw AppException.Conflict($"A client named '{name}' already exists.");

        var client = new Client { Name = name };
        _db.Clients.Add(client);
        await _db.SaveChangesAsync();
        return new ClientDto(client.Id, client.Name, client.IsArchived, 0);
    }

    public async Task<ClientDto?> UpdateAsync(Guid id, UpsertClientRequest request)
    {
        var client = await _db.Clients.FirstOrDefaultAsync(c => c.Id == id);
        if (client is null) return null;

        var name = request.Name.Trim();
        if (await _db.Clients.AnyAsync(c => c.Name == name && c.Id != id))
            throw AppException.Conflict($"A client named '{name}' already exists.");

        client.Name = name;
        await _db.SaveChangesAsync();
        return await GetAsync(id);
    }

    public async Task<ClientDto?> SetArchivedAsync(Guid id, bool archived)
    {
        var client = await _db.Clients.FirstOrDefaultAsync(c => c.Id == id);
        if (client is null) return null;
        client.IsArchived = archived;
        await _db.SaveChangesAsync();
        return await GetAsync(id);
    }

    /// <summary>Hard delete — only allowed while the client has no projects.</summary>
    public async Task<bool> DeleteAsync(Guid id)
    {
        var client = await _db.Clients.Include(c => c.Projects).FirstOrDefaultAsync(c => c.Id == id);
        if (client is null) return false;

        if (client.Projects.Count > 0)
            throw AppException.BadRequest(
                "This client still has projects. Archive it instead, or remove its projects first.");

        _db.Clients.Remove(client);
        await _db.SaveChangesAsync();
        return true;
    }
}
