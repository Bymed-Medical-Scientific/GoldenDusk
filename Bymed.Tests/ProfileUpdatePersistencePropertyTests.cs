using Bymed.Application.Persistence;
using Bymed.Application.Users;
using Bymed.Domain.Entities;
using Bymed.Domain.Enums;
using Bymed.Infrastructure;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using ApplicationDbContext = Bymed.Infrastructure.Persistence.ApplicationDbContext;

namespace Bymed.Tests;

/// <summary>
/// Property 14: Profile Update Persistence.
/// For any valid profile name update, the persisted user profile must reflect the updated value.
/// Validates: Requirements 4.5
/// </summary>
public class ProfileUpdatePersistencePropertyTests
{
    // Feature: bymed-website, Property 14: Profile Update Persistence
    [Property(MaxTest = 50)]
    public Property UpdateProfile_PersistsLatestName_ForValidNames()
    {
        var nameGen = ArbMap.Default.GeneratorFor<string>()
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim())
            .Where(s => s.Length <= User.NameMaxLength);

        return Prop.ForAll(nameGen.ToArbitrary(), updatedName =>
        {
            using var scope = CartTestHelpers.CreateScopeAsync().GetAwaiter().GetResult();
            var sp = scope.ServiceProvider;

            var db = sp.GetRequiredService<ApplicationDbContext>();
            var user = new User(
                email: $"profile-{Guid.NewGuid():N}@example.com",
                name: "Original Name",
                role: UserRole.Customer);

            user.SetPasswordHash("hashed-password");
            db.Users.Add(user);
            db.SaveChanges();

            var userRepository = sp.GetRequiredService<Bymed.Application.Repositories.IUserRepository>();
            var unitOfWork = sp.GetRequiredService<IUnitOfWork>();
            var handler = new UpdateUserProfileCommandHandler(userRepository, unitOfWork);

            var result = handler
                .Handle(new UpdateUserProfileCommand(user.Id, new UpdateProfileRequest(updatedName)), CancellationToken.None)
                .GetAwaiter()
                .GetResult();

            result.IsSuccess.Should().BeTrue(result.Error ?? "expected successful profile update");
            result.Value.Should().NotBeNull();
            result.Value!.Name.Should().Be(updatedName.Trim());

            var reloaded = db.Users.Single(u => u.Id == user.Id);
            reloaded.Name.Should().Be(updatedName.Trim());

            return true;
        });
    }
}
