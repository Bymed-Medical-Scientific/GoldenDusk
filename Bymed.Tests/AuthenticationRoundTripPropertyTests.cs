using Bymed.Application.Auth;
using Bymed.Domain.Enums;
using Bymed.Infrastructure;
using Bymed.Infrastructure.Identity;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using ApplicationDbContext = Bymed.Infrastructure.Persistence.ApplicationDbContext;

namespace Bymed.Tests;

/// <summary>
/// Property 12: Authentication Round Trip.
/// For any valid user credentials, login should succeed and return the user's session.
/// For any invalid credentials, login should fail.
/// Validates: Requirements 4.3
/// </summary>
public class AuthenticationRoundTripPropertyTests
{
    private const string TestSecretKey = "TestSecretKeyForJwtSigning-MustBeLongEnough-32Chars";
    private const string ValidTestPassword = "ValidPass1!word";

    /// <summary>
    /// Integration-style: Register a user then login with same credentials succeeds and returns session (user + token).
    /// Feature: bymed-website, Property 12: Authentication Round Trip
    /// </summary>
    [Fact]
    public async Task ValidCredentials_LoginSucceeds_AndReturnsSession()
    {
        var (authService, _) = await CreateAuthServicesAsync();

        var email = "roundtrip@example.com";
        var password = ValidTestPassword;
        var name = "Round Trip User";

        var registerResult = await authService.RegisterAsync(new RegisterRequest
        {
            Email = email,
            Password = password,
            Name = name
        });

        registerResult.IsSuccess.Should().BeTrue("registration should succeed with valid data. Error: " + (registerResult.Error ?? ""));
        registerResult.Value.Should().NotBeNull();
        registerResult.Value!.Token.Should().NotBeNullOrEmpty();
        registerResult.Value.RefreshToken.Should().NotBeNullOrEmpty();
        registerResult.Value.User.Email!.ToUpperInvariant().Should().Be(email.ToUpperInvariant(), "Identity may normalize email casing");
        registerResult.Value.User.Name.Should().Be(name);
        registerResult.Value.User.Role.Should().Be(UserRole.Admin, "the first registered account should bootstrap admin access");

        var loginResult = await authService.LoginAsync(new LoginRequest
        {
            Email = email,
            Password = password
        });

        loginResult.IsSuccess.Should().BeTrue("login with same credentials should succeed");
        loginResult.Value.Should().NotBeNull();
        loginResult.Value!.Token.Should().NotBeNullOrEmpty("session must include access token");
        loginResult.Value.RefreshToken.Should().NotBeNullOrEmpty("session must include refresh token");
        loginResult.Value.User.Email!.ToUpperInvariant().Should().Be(email.ToUpperInvariant(), "Identity may normalize email casing");
        loginResult.Value.User.Name.Should().Be(name);
        loginResult.Value.User.Role.Should().Be(UserRole.Admin);
    }

    /// <summary>
    /// Invalid credentials (wrong password): login must fail.
    /// Feature: bymed-website, Property 12: Authentication Round Trip
    /// </summary>
    [Fact]
    public async Task InvalidPassword_LoginFails()
    {
        var (authService, _) = await CreateAuthServicesAsync();

        var email = "wrongpwd@example.com";
        var password = ValidTestPassword;

        await authService.RegisterAsync(new RegisterRequest
        {
            Email = email,
            Password = password,
            Name = "User"
        });

        var loginResult = await authService.LoginAsync(new LoginRequest
        {
            Email = email,
            Password = "wrongpassword"
        });

        loginResult.IsSuccess.Should().BeFalse("login with wrong password must fail");
        loginResult.Error.Should().NotBeNullOrEmpty();
    }

    /// <summary>
    /// Invalid credentials (unknown email): login must fail.
    /// Feature: bymed-website, Property 12: Authentication Round Trip
    /// </summary>
    [Fact]
    public async Task UnknownEmail_LoginFails()
    {
        var (authService, _) = await CreateAuthServicesAsync();

        var loginResult = await authService.LoginAsync(new LoginRequest
        {
            Email = "nonexistent@example.com",
            Password = "anypassword"
        });

        loginResult.IsSuccess.Should().BeFalse("login with non-existent email must fail");
        loginResult.Error.Should().NotBeNullOrEmpty();
    }

    /// <summary>
    /// The second account registered after bootstrap must remain a customer account.
    /// Feature: bymed-website, Property 12: Authentication Round Trip
    /// </summary>
    [Fact]
    public async Task SecondRegisteredUser_IsCustomer()
    {
        var (authService, _) = await CreateAuthServicesAsync();

        var first = await authService.RegisterAsync(new RegisterRequest
        {
            Email = "first-admin@example.com",
            Password = ValidTestPassword,
            Name = "First User"
        });

        var second = await authService.RegisterAsync(new RegisterRequest
        {
            Email = "second-customer@example.com",
            Password = ValidTestPassword,
            Name = "Second User"
        });

        first.IsSuccess.Should().BeTrue();
        first.Value.Should().NotBeNull();
        first.Value!.User.Role.Should().Be(UserRole.Admin);

        second.IsSuccess.Should().BeTrue();
        second.Value.Should().NotBeNull();
        second.Value!.User.Role.Should().Be(UserRole.Customer);
    }

    private static async Task<(IAuthService AuthService, IServiceScope Scope)> CreateAuthServicesAsync()
    {
        var connection = new Microsoft.Data.Sqlite.SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlite(connection));

        services.AddLogging();
        services.AddInfrastructureRepositories();

        services.AddIdentityCore<ApplicationUser>(options =>
        {
            options.Password.RequiredLength = Bymed.Application.Auth.PasswordPolicy.MinimumLength;
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = true;
            options.User.RequireUniqueEmail = true;
            options.Lockout.AllowedForNewUsers = true;
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        })
        .AddUserStore<BymedUserStore>();
        // Do not add AddDefaultTokenProviders() in test - it requires IDataProtectionProvider; login/register only need password hashing

        services.AddBymedAuth();

        services.Configure<JwtSettings>(options =>
        {
            options.SecretKey = TestSecretKey;
            options.Issuer = "BymedApi";
            options.Audience = "BymedApi";
            options.ExpirationMinutes = 15;
            options.RefreshTokenExpirationDays = 7;
        });

        var provider = services.BuildServiceProvider();
        var scope = provider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await context.Database.EnsureCreatedAsync();

        var authService = scope.ServiceProvider.GetRequiredService<IAuthService>();
        return (authService, scope);
    }
}
