namespace Bymed.Application.Auth;

/// <summary>
/// Password rules aligned with ASP.NET Identity configuration in the API host.
/// </summary>
public static class PasswordPolicy
{
    public const int MinimumLength = 12;

    public const string ComplexityDescription =
        "Password must be at least 12 characters and include uppercase, lowercase, digit, and special character.";

    public static bool MeetsComplexity(string? password)
    {
        if (string.IsNullOrEmpty(password) || password.Length < MinimumLength)
            return false;

        var hasLower = false;
        var hasUpper = false;
        var hasDigit = false;
        var hasSpecial = false;
        foreach (var ch in password)
        {
            if (char.IsLower(ch))
                hasLower = true;
            else if (char.IsUpper(ch))
                hasUpper = true;
            else if (char.IsDigit(ch))
                hasDigit = true;
            else if (!char.IsLetterOrDigit(ch))
                hasSpecial = true;
        }

        return hasLower && hasUpper && hasDigit && hasSpecial;
    }
}
