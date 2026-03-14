using Bymed.Domain.Entities;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.AspNetCore.Identity;
using Xunit;

namespace Bymed.Tests;

/// <summary>
/// Property 32: Password Hashing.
/// For any password storage operation, the stored value should be a hashed version (not plaintext)
/// using PBKDF2 or similar algorithm.
/// Validates: Requirements 12.2
/// </summary>
public class PasswordHashingPropertyTests
{
    private static readonly Arbitrary<string> PasswordsArb =
        ArbMap.Default.GeneratorFor<string>()
            .Select(s => (s ?? "") + "12345678")
            .Where(s => s.Length >= 8)
            .ToArbitrary();

    // Feature: bymed-website, Property 32: Password Hashing
    [Property(MaxTest = 100)]
    public Property HashPassword_ShouldNeverReturnPlaintext()
    {
        return Prop.ForAll(PasswordsArb, password =>
        {
            var hasher = new PasswordHasher<User>();
            var hashedPassword = hasher.HashPassword(null!, password);
            return (hashedPassword != password && !string.IsNullOrEmpty(hashedPassword))
                .Label("Stored value must be non-empty hash, not plaintext");
        });
    }

    // Feature: bymed-website, Property 32: Password Hashing (verify round-trip)
    [Property(MaxTest = 100)]
    public Property VerifyHashedPassword_ShouldSucceedForCorrectPassword()
    {
        return Prop.ForAll(PasswordsArb, password =>
        {
            var hasher = new PasswordHasher<User>();
            var hashed = hasher.HashPassword(null!, password);
            var result = hasher.VerifyHashedPassword(null!, hashed, password);
            return (result == PasswordVerificationResult.Success)
                .Label("Correct password verifies against its hash");
        });
    }

    // Feature: bymed-website, Property 32: Password Hashing (wrong password fails)
    [Property(MaxTest = 50)]
    public Property VerifyHashedPassword_ShouldFailForWrongPassword()
    {
        return Prop.ForAll(PasswordsArb, PasswordsArb, (password, wrongPassword) =>
        {
            if (string.Equals(password, wrongPassword, StringComparison.Ordinal))
                return true.Label("Skipped when passwords equal");
            var hasher = new PasswordHasher<User>();
            var hashed = hasher.HashPassword(null!, password);
            var result = hasher.VerifyHashedPassword(null!, hashed, wrongPassword);
            return (result == PasswordVerificationResult.Failed)
                .Label("Wrong password must not verify");
        });
    }
}
