using FluentAssertions;
using Tspm.Application.Common;
using Xunit;

namespace Tspm.Tests;

public class PasswordGeneratorTests
{
    [Fact]
    public void Generates_requested_length()
        => PasswordGenerator.Generate(14).Should().HaveLength(14);

    [Fact]
    public void Enforces_minimum_length()
        => PasswordGenerator.Generate(4).Should().HaveLength(8);

    [Fact]
    public void Satisfies_identity_password_policy()
    {
        for (var i = 0; i < 50; i++)
        {
            var pwd = PasswordGenerator.Generate();
            pwd.Should().MatchRegex("[A-Z]", "needs an uppercase letter");
            pwd.Should().MatchRegex("[a-z]", "needs a lowercase letter");
            pwd.Should().MatchRegex("[0-9]", "needs a digit");
        }
    }

    [Fact]
    public void Avoids_ambiguous_characters()
        => PasswordGenerator.Generate(64).Should().NotContainAny("I", "O", "l", "0", "1");

    [Fact]
    public void Produces_unique_passwords()
    {
        var generated = Enumerable.Range(0, 100).Select(_ => PasswordGenerator.Generate()).ToList();
        generated.Distinct().Should().HaveCount(100);
    }
}
