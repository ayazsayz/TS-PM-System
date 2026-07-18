using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Tspm.Application.Common.Interfaces;
using Tspm.Domain.Entities;
using Tspm.Infrastructure.Persistence;
using Xunit;

namespace Tspm.Tests;

/// <summary>
/// Proves the DbContext's global query filter + save-stamping keep organizations
/// isolated: a context acting as Org A can never see or touch Org B's data.
/// </summary>
public class TenantIsolationTests
{
    private sealed class StubTenant(Guid? id) : ICurrentTenant
    {
        public Guid? OrganizationId { get; } = id;
    }

    private static AppDbContext ContextFor(Guid database, Guid? tenant)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            // A shared in-memory store keyed by name, so separate contexts see the same data.
            .UseInMemoryDatabase($"iso-{database}")
            .Options;
        return new AppDbContext(options, new StubTenant(tenant));
    }

    [Fact]
    public async Task Save_stamps_the_current_tenant_automatically()
    {
        var db = Guid.NewGuid();
        var orgA = Guid.NewGuid();

        await using var ctx = ContextFor(db, orgA);
        ctx.Clients.Add(new Client { Name = "Acme Client" }); // OrganizationId left unset
        await ctx.SaveChangesAsync();

        var saved = await ctx.Clients.IgnoreQueryFilters().SingleAsync();
        saved.OrganizationId.Should().Be(orgA, "the context stamps new rows with the current tenant");
    }

    [Fact]
    public async Task Queries_only_return_the_current_tenants_rows()
    {
        var db = Guid.NewGuid();
        var orgA = Guid.NewGuid();
        var orgB = Guid.NewGuid();

        await using (var a = ContextFor(db, orgA))
        {
            a.Clients.Add(new Client { Name = "Acme" });
            a.Projects.Add(new Project { Name = "Acme Project", ClientId = Guid.NewGuid(), ColorHex = "#000" });
            await a.SaveChangesAsync();
        }

        await using (var b = ContextFor(db, orgB))
        {
            b.Clients.Add(new Client { Name = "Globex" });
            await b.SaveChangesAsync();
        }

        // Org A sees only its own.
        await using (var a = ContextFor(db, orgA))
        {
            (await a.Clients.ToListAsync()).Should().ContainSingle().Which.Name.Should().Be("Acme");
            (await a.Projects.ToListAsync()).Should().ContainSingle();
        }

        // Org B sees only its own.
        await using (var b = ContextFor(db, orgB))
        {
            (await b.Clients.ToListAsync()).Should().ContainSingle().Which.Name.Should().Be("Globex");
            (await b.Projects.ToListAsync()).Should().BeEmpty("Org B created no projects");
        }
    }

    [Fact]
    public async Task Other_tenants_row_is_invisible_by_id()
    {
        var db = Guid.NewGuid();
        var orgA = Guid.NewGuid();
        var orgB = Guid.NewGuid();

        Guid acmeClientId;
        await using (var a = ContextFor(db, orgA))
        {
            var client = new Client { Name = "Acme" };
            a.Clients.Add(client);
            await a.SaveChangesAsync();
            acmeClientId = client.Id;
        }

        // Org B cannot fetch Org A's client even with its exact id.
        await using var b = ContextFor(db, orgB);
        (await b.Clients.FirstOrDefaultAsync(c => c.Id == acmeClientId))
            .Should().BeNull("the query filter hides other tenants' rows");
    }

    [Fact]
    public async Task No_tenant_context_sees_nothing()
    {
        var db = Guid.NewGuid();
        var orgA = Guid.NewGuid();

        await using (var a = ContextFor(db, orgA))
        {
            a.Clients.Add(new Client { Name = "Acme" });
            await a.SaveChangesAsync();
        }

        // A context with no tenant (Guid.Empty) fails closed.
        await using var none = ContextFor(db, null);
        (await none.Clients.ToListAsync()).Should().BeEmpty();
    }
}
