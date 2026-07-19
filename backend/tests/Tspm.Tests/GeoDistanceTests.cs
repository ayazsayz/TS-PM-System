using FluentAssertions;
using Tspm.Application.Common;
using Xunit;

namespace Tspm.Tests;

public class GeoDistanceTests
{
    [Fact]
    public void Same_point_is_zero()
        => GeoDistance.MetersBetween(24.8607, 67.0011, 24.8607, 67.0011).Should().Be(0);

    [Fact]
    public void Is_symmetric()
    {
        var a = GeoDistance.MetersBetween(24.8607, 67.0011, 24.8615, 67.0025);
        var b = GeoDistance.MetersBetween(24.8615, 67.0025, 24.8607, 67.0011);
        a.Should().BeApproximately(b, 0.001);
    }

    [Fact]
    public void One_degree_of_latitude_is_about_111km()
        => GeoDistance.MetersBetween(0, 0, 1, 0).Should().BeApproximately(111_195, 500);

    [Fact]
    public void Known_distance_karachi_to_lahore()
    {
        // ~1,020 km great-circle.
        var meters = GeoDistance.MetersBetween(24.8607, 67.0011, 31.5204, 74.3587);
        meters.Should().BeApproximately(1_020_000, 25_000);
    }

    [Theory]
    // A point ~90 m away should be inside a 150 m geofence but outside a 50 m one.
    [InlineData(150, true)]
    [InlineData(50, false)]
    public void Geofence_radius_decides_in_office(int radiusMeters, bool expectedInside)
    {
        const double officeLat = 24.8607, officeLng = 67.0011;
        // ~0.0008° of latitude ≈ 89 m north.
        var distance = GeoDistance.MetersBetween(officeLat + 0.0008, officeLng, officeLat, officeLng);

        (distance <= radiusMeters).Should().Be(expectedInside, $"distance was {distance:F0} m");
    }
}
