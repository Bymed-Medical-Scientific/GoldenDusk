using Bymed.Application.Auth;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Xunit;

namespace Bymed.Tests;

/// <summary>
/// Property 11: Registration Validation.
/// For any registration attempt, invalid email formats should be rejected and passwords
/// not meeting strength requirements (minimum 8 characters) should be rejected.
/// Validates: Requirements 4.2
/// </summary>
public class RegistrationValidationPropertyTests
{
    private static readonly RegisterRequestValidator Validator = new();

    private static readonly Arbitrary<string> InvalidEmailArb =
        ArbMap.Default.GeneratorFor<string>()
            .Where(s => string.IsNullOrWhiteSpace(s) || (s != null && !IsValidEmailFormat(s)))
            .ToArbitrary();

    private static readonly Arbitrary<string> ShortPasswordArb =
        ArbMap.Default.GeneratorFor<string>()
            .Select(s => (s ?? "").Length > 8 ? (s ?? "").Substring(0, 7) : (s ?? ""))
            .Where(s => s.Length < 8)
            .ToArbitrary();

    private static bool IsValidEmailFormat(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;
        var atIndex = email.IndexOf('@');
        return atIndex > 0 && atIndex < email.Length - 1 && email.IndexOf('@', atIndex + 1) < 0;
    }

    // Feature: bymed-website, Property 11: Registration Validation (invalid email rejected)
    [Property(MaxTest = 100)]
    public Property InvalidEmailFormat_ShouldFailValidation()
    {
        return Prop.ForAll(InvalidEmailArb, email =>
        {
            var request = new RegisterRequest
            {
                Email = email ?? "",
                Password = "password1",
                Name = "Test User"
            };
            var validationResult = Validator.Validate(request);
            return (validationResult.IsValid == false)
                .Label("Invalid email format must be rejected");
        });
    }

    // Feature: bymed-website, Property 11: Registration Validation (short password rejected)
    [Property(MaxTest = 100)]
    public Property PasswordShorterThan8_ShouldFailValidation()
    {
        return Prop.ForAll(ShortPasswordArb, password =>
        {
            var request = new RegisterRequest
            {
                Email = "user@example.com",
                Password = password ?? "",
                Name = "Test User"
            };
            var validationResult = Validator.Validate(request);
            return (validationResult.IsValid == false)
                .Label("Password with fewer than 8 characters must be rejected");
        });
    }

    // Feature: bymed-website, Property 11: Registration Validation (valid request passes)
    [Property(MaxTest = 50)]
    public Property ValidEmailAndPassword_ShouldPassValidation()
    {
        var validEmail = ArbMap.Default.GeneratorFor<string>()
            .Select(s => "u" + (s ?? "").Replace("@", "").Replace(" ", "") + "@example.com")
            .Where(s => s.Length >= 12 && IsValidEmailFormat(s))
            .ToArbitrary();
        var validPassword = ArbMap.Default.GeneratorFor<string>()
            .Select(s => (s ?? "") + "12345678")
            .Where(s => s.Length >= 8)
            .ToArbitrary();

        return Prop.ForAll(validEmail, validPassword, (email, password) =>
        {
            var request = new RegisterRequest
            {
                Email = email ?? "user@example.com",
                Password = password ?? "12345678",
                Name = "Test User"
            };
            var validationResult = Validator.Validate(request);
            return validationResult.IsValid
                .Label("Valid email and password (8+ chars) must pass validation");
        });
    }
}
