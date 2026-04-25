using Bymed.Application.Auth;
using Bymed.Domain.Enums;
using Bymed.Infrastructure;
using Bymed.Infrastructure.Email;
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
        var (authService, scope) = await CreateAuthServicesAsync();

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
        registerResult.Value!.Token.Should().BeNull();
        registerResult.Value.RefreshToken.Should().BeNull();
        registerResult.Value.User.Email!.ToUpperInvariant().Should().Be(email.ToUpperInvariant(), "Identity may normalize email casing");
        registerResult.Value.User.Name.Should().Be(name);
        registerResult.Value.User.Role.Should().Be(UserRole.Customer, "storefront registration is always a customer");
        registerResult.Value.User.IsActive.Should().BeFalse();
        registerResult.Value.PendingAdminApproval.Should().BeFalse();

        await ConfirmUserEmailAsync(scope, email);

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
        loginResult.Value.User.Role.Should().Be(UserRole.Customer);
        loginResult.Value.User.IsActive.Should().BeTrue();
    }

    /// <summary>
    /// Invalid credentials (wrong password): login must fail.
    /// Feature: bymed-website, Property 12: Authentication Round Trip
    /// </summary>
    [Fact]
    public async Task InvalidPassword_LoginFails()
    {
        var (authService, scope) = await CreateAuthServicesAsync();

        var email = "wrongpwd@example.com";
        var password = ValidTestPassword;

        await authService.RegisterAsync(new RegisterRequest
        {
            Email = email,
            Password = password,
            Name = "User"
        });
        await ConfirmUserEmailAsync(scope, email);

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
        var (authService, scope) = await CreateAuthServicesAsync();

        var loginResult = await authService.LoginAsync(new LoginRequest
        {
            Email = "nonexistent@example.com",
            Password = "anypassword"
        });

        loginResult.IsSuccess.Should().BeFalse("login with non-existent email must fail");
        loginResult.Error.Should().NotBeNullOrEmpty();
    }

    /// <summary>
    /// Two storefront registrations are both customers with active sessions.
    /// Feature: bymed-website, Property 12: Authentication Round Trip
    /// </summary>
    [Fact]
    public async Task SecondStorefrontRegisteredUser_IsCustomer()
    {
        var (authService, scope) = await CreateAuthServicesAsync();

        var first = await authService.RegisterAsync(new RegisterRequest
        {
            Email = "first-customer@example.com",
            Password = ValidTestPassword,
            Name = "First User",
            RegistrationChannel = RegistrationChannel.Storefront
        });

        var second = await authService.RegisterAsync(new RegisterRequest
        {
            Email = "second-customer@example.com",
            Password = ValidTestPassword,
            Name = "Second User",
            RegistrationChannel = RegistrationChannel.Storefront
        });

        first.IsSuccess.Should().BeTrue();
        first.Value.Should().NotBeNull();
        first.Value!.User.Role.Should().Be(UserRole.Customer);
        first.Value.User.IsActive.Should().BeFalse();

        second.IsSuccess.Should().BeTrue();
        second.Value.Should().NotBeNull();
        second.Value!.User.Role.Should().Be(UserRole.Customer);
        second.Value.User.IsActive.Should().BeFalse();

        await ConfirmUserEmailAsync(scope, "first-customer@example.com");
        await ConfirmUserEmailAsync(scope, "second-customer@example.com");
    }

    /// <summary>
    /// Admin-panel registration remains inactive until both email verification and admin approval are complete.
    /// </summary>
    [Fact]
    public async Task FirstAdminPanelRegistration_RemainsPendingWithoutApproval()
    {
        var (authService, scope) = await CreateAuthServicesAsync();

        var result = await authService.RegisterAsync(new RegisterRequest
        {
            Email = "bootstrap-admin@example.com",
            Password = ValidTestPassword,
            Name = "Bootstrap Admin",
            RegistrationChannel = RegistrationChannel.AdminPanel
        });

        result.IsSuccess.Should().BeTrue();
        result.Value!.User.Role.Should().Be(UserRole.Admin);
        result.Value.User.IsActive.Should().BeFalse();
        result.Value.PendingAdminApproval.Should().BeTrue();
        result.Value.Token.Should().BeNull();

        await ConfirmUserEmailAsync(scope, "bootstrap-admin@example.com");

        var login = await authService.LoginAsync(new LoginRequest
        {
            Email = "bootstrap-admin@example.com",
            Password = ValidTestPassword
        });
        login.IsSuccess.Should().BeFalse();
        login.Error.Should().Contain("not active");
    }

    /// <summary>
    /// After at least one user exists, admin-panel registration stays inactive until approval (no session tokens).
    /// </summary>
    [Fact]
    public async Task AdminPanelRegistration_AfterBootstrap_IsPendingWithoutSession()
    {
        var (authService, scope) = await CreateAuthServicesAsync();

        await authService.RegisterAsync(new RegisterRequest
        {
            Email = "seed@example.com",
            Password = ValidTestPassword,
            Name = "Seed",
            RegistrationChannel = RegistrationChannel.Storefront
        });
        await ConfirmUserEmailAsync(scope, "seed@example.com");

        var pending = await authService.RegisterAsync(new RegisterRequest
        {
            Email = "pending-admin@example.com",
            Password = ValidTestPassword,
            Name = "Pending Admin",
            RegistrationChannel = RegistrationChannel.AdminPanel
        });

        pending.IsSuccess.Should().BeTrue();
        pending.Value!.PendingAdminApproval.Should().BeTrue();
        pending.Value.Token.Should().BeNull();
        pending.Value.RefreshToken.Should().BeNull();
        pending.Value.User.Role.Should().Be(UserRole.Admin);
        pending.Value.User.IsActive.Should().BeFalse();

        await ConfirmUserEmailAsync(scope, "pending-admin@example.com");

        var login = await authService.LoginAsync(new LoginRequest
        {
            Email = "pending-admin@example.com",
            Password = ValidTestPassword
        });
        login.IsSuccess.Should().BeFalse();
        login.Error.Should().Contain("not active");
    }

    private static async Task ConfirmUserEmailAsync(IServiceScope scope, string email)
    {
        var authService = scope.ServiceProvider.GetRequiredService<IAuthService>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await userManager.FindByEmailAsync(email);
        user.Should().NotBeNull();
        var token = await userManager.GenerateEmailConfirmationTokenAsync(user!);
        var confirmResult = await authService.ConfirmEmailAsync(new ConfirmEmailRequest
        {
            Email = email,
            Token = token
        });
        confirmResult.IsSuccess.Should().BeTrue("email confirmation should succeed for test user");
    }

    private static async Task<(IAuthService AuthService, IServiceScope Scope)> CreateAuthServicesAsync()
    {
        var connection = new Microsoft.Data.Sqlite.SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlite(connection));

        services.AddLogging();
        services.AddDataProtection();
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
        .AddUserStore<BymedUserStore>()
        .AddDefaultTokenProviders();

        services.AddBymedAuth();

        services.Configure<JwtSettings>(options =>
        {
            options.SecretKey = TestSecretKey;
            options.Issuer = "BymedApi";
            options.Audience = "BymedApi";
            options.ExpirationMinutes = 15;
            options.RefreshTokenExpirationDays = 7;
        });

        services.Configure<EmailOptions>(o =>
        {
            o.FromAddress = "test@example.com";
            o.FromName = "Test";
            o.Host = "localhost";
            o.Port = 587;
            o.Username = "user";
            o.Password = "pass";
            o.ContactFormRecipient = "contact@example.com";
            o.PasswordResetBaseUrl = "https://example.com/reset-password";
            o.EmailVerificationBaseUrl = "https://example.com/verify-email";
            o.AdminApprovalNotifyRecipients = "approver@example.com";
            o.AdminPanelBaseUrl = "https://localhost:4200";
        });

        var provider = services.BuildServiceProvider();
        var scope = provider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await context.Database.EnsureCreatedAsync();

        var authService = scope.ServiceProvider.GetRequiredService<IAuthService>();
        return (authService, scope);
    }
}
