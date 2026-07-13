using FluentAssertions;
using Tspm.Application.Common;
using Tspm.Domain.Enums;
using Xunit;

namespace Tspm.Tests;

public class FormattingTests
{
    [Fact]
    public void WeekRange_same_month()
        => Format.WeekRange(new DateOnly(2026, 6, 22)).Should().Be("Jun 22 – 28");

    [Fact]
    public void WeekRange_spanning_months()
        => Format.WeekRange(new DateOnly(2026, 6, 29)).Should().Be("Jun 29 – Jul 5");

    [Theory]
    [InlineData(25, "25 min ago")]
    [InlineData(60 * 3, "3 h ago")]
    public void Ago_relative_labels(int minutesAgo, string expected)
    {
        var now = new DateTime(2026, 7, 3, 12, 0, 0, DateTimeKind.Utc);
        Format.Ago(now.AddMinutes(-minutesAgo), now).Should().Be(expected);
    }

    [Fact]
    public void Status_submitted_reads_as_pending()
        => DisplayNames.Status(TimesheetStatus.Submitted).Should().Be("Pending");

    [Theory]
    [InlineData(ProjectHealth.OnTrack, "On track")]
    [InlineData(ProjectHealth.OverBudget, "Over budget")]
    [InlineData(ProjectHealth.AtRisk, "At risk")]
    public void Health_labels(ProjectHealth health, string expected)
        => DisplayNames.Health(health).Should().Be(expected);
}
