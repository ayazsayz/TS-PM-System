using System.Globalization;

namespace Tspm.Application.Common;

public static class Format
{
    private static readonly CultureInfo Inv = CultureInfo.InvariantCulture;

    /// <summary>Week label like "Jun 22 – 28" or "Jun 29 – Jul 5".</summary>
    public static string WeekRange(DateOnly weekStart)
    {
        var end = weekStart.AddDays(6);
        return weekStart.Month == end.Month
            ? $"{weekStart.ToString("MMM d", Inv)} – {end.Day}"
            : $"{weekStart.ToString("MMM d", Inv)} – {end.ToString("MMM d", Inv)}";
    }

    /// <summary>Submitted label like "Mon 9:12 AM".</summary>
    public static string DayTime(DateTime dt) => dt.ToString("ddd h:mm tt", Inv);

    /// <summary>Relative label like "25 min ago", "3 h ago", "Yesterday".</summary>
    public static string Ago(DateTime dt, DateTime? nowUtc = null)
    {
        var now = nowUtc ?? DateTime.UtcNow;
        var span = now - dt;
        if (span < TimeSpan.Zero) return "just now";
        if (span.TotalMinutes < 1) return "just now";
        if (span.TotalMinutes < 60) return $"{(int)span.TotalMinutes} min ago";
        if (span.TotalHours < 24) return $"{(int)span.TotalHours} h ago";
        if (span.TotalDays < 2) return "Yesterday";
        if (span.TotalDays < 7) return $"{(int)span.TotalDays} days ago";
        return dt.ToString("MMM d", Inv);
    }
}
