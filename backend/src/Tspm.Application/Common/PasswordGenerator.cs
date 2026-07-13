using System.Security.Cryptography;

namespace Tspm.Application.Common;

/// <summary>
/// Generates cryptographically-random one-time passwords that satisfy the
/// Identity policy (length, upper, lower, digit) without ambiguous characters.
/// </summary>
public static class PasswordGenerator
{
    private const string Upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";   // no I, O
    private const string Lower = "abcdefghijkmnopqrstuvwxyz";   // no l
    private const string Digits = "23456789";                   // no 0, 1
    private const string Symbols = "!@#$%*?";

    public static string Generate(int length = 12)
    {
        if (length < 8) length = 8;

        // Guarantee one of each required class, then fill the rest.
        var chars = new List<char>
        {
            Pick(Upper),
            Pick(Lower),
            Pick(Digits),
            Pick(Symbols),
        };

        const string all = Upper + Lower + Digits + Symbols;
        while (chars.Count < length) chars.Add(Pick(all));

        // Fisher–Yates shuffle so the guaranteed chars aren't always in front.
        for (var i = chars.Count - 1; i > 0; i--)
        {
            var j = RandomNumberGenerator.GetInt32(i + 1);
            (chars[i], chars[j]) = (chars[j], chars[i]);
        }

        return new string(chars.ToArray());
    }

    private static char Pick(string set) => set[RandomNumberGenerator.GetInt32(set.Length)];
}
