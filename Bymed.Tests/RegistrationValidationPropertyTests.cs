using Bymed.Application.Auth;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Xunit;

namespace Bymed.Tests;

/// <summary>
/// Property 11: Registration Validation.
/// For any registration attempt, invalid email formats should be rejected and passwords
/// not meeting strength requirements should be rejected.
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
            .Select(s =>
            {
                var raw = s ?? "";
                if (raw.Length >= PasswordPolicy.MinimumLength)
                    raw = raw[..(PasswordPolicy.MinimumLength - 1)];
                return raw;
            })
            .Where(s => s.Length < PasswordPolicy.MinimumLength)
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
                Password = "ValidPass1!word",
                Name = "Test User"
            };
            var validationResult = Validator.Validate(request);
            return (validationResult.IsValid == false)
                .Label("Invalid email format must be rejected");
        });
    }

    // Feature: bymed-website, Property 11: Registration Validation (short password rejected)
    [Property(MaxTest = 100)]
    public Property PasswordShorterThanMinimum_ShouldFailValidation()
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
                .Label($"Password with fewer than {PasswordPolicy.MinimumLength} characters must be rejected");
        });
    }

    [Fact]
    public void Password_WithoutComplexity_ShouldFailValidation()
    {
        var request = new RegisterRequest
        {
            Email = "user@example.com",
            Password = "abcdefghijkl",
            Name = "Test User"
        };
        var result = Validator.Validate(request);
        result.IsValid.Should().BeFalse();
    }

    // Feature: bymed-website, Property 11: Registration Validation (valid request passes)
    [Property(MaxTest = 50)]
    public Property ValidEmailAndPassword_ShouldPassValidation()
    {
        var validEmail = ArbMap.Default.GeneratorFor<string>()
            .Select(s => "u" + (s ?? "").Replace("@", "").Replace(" ", "") + "@example.com")
            .Where(s => s.Length >= 12 && IsValidEmailFormat(s))
            .ToArbitrary();

        return Prop.ForAll(validEmail, email =>
        {
            var request = new RegisterRequest
            {
                Email = email ?? "user@example.com",
                Password = "ValidPass1!word",
                Name = "Test User"
            };
            var validationResult = Validator.Validate(request);
            return validationResult.IsValid
                .Label("Valid email and strong password must pass validation");
        });
    }
}
