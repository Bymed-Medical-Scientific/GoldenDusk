using Bymed.Application.Contact;
using Bymed.Application.Notifications;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using NSubstitute;

namespace Bymed.Tests;

/// <summary>
/// Properties 36, 37, 38, 40 for contact form behavior.
/// Validates: Requirements 14.2, 14.3, 14.4, 14.6
/// </summary>
public class ContactFormPropertyTests
{
    private static Arbitrary<SubmitContactFormRequest> ValidRequestArbitrary()
    {
        var nonEmptyGen = ArbMap.Default.GeneratorFor<string>()
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim());
        var safeEmailLocalPartGen = ArbMap.Default.GeneratorFor<int>()
            .Where(i => i != int.MinValue)
            .Select(i => $"user{Math.Abs(i)}");

        return (from name in nonEmptyGen.Where(s => s.Length <= 100)
            from localPart in safeEmailLocalPartGen
            from subject in nonEmptyGen.Where(s => s.Length <= 200)
            from message in nonEmptyGen.Where(s => s.Length <= 5000)
            select new SubmitContactFormRequest
            {
                Name = name,
                Email = $"{localPart}@example.com",
                Subject = subject,
                Message = message
            }).ToArbitrary();
    }

    private static Arbitrary<SubmitContactFormRequest> InvalidEmailRequestArbitrary()
    {
        var nonEmptyGen = ArbMap.Default.GeneratorFor<string>()
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim());
        var invalidEmailGen = ArbMap.Default.GeneratorFor<int>()
            .Where(i => i != int.MinValue)
            .Select(i => $"user{Math.Abs(i)}.example.com");

        return (from name in nonEmptyGen.Where(s => s.Length <= 100)
            from email in invalidEmailGen
            from subject in nonEmptyGen.Where(s => s.Length <= 200)
            from message in nonEmptyGen.Where(s => s.Length <= 5000)
            select new SubmitContactFormRequest
            {
                Name = name,
                Email = email,
                Subject = subject,
                Message = message
            }).ToArbitrary();
    }

    // Feature: bymed-website, Property 36: Contact Form Submission
    [Property(MaxTest = 60)]
    public Property ValidSubmission_ShouldTriggerContactEmail()
    {
        return Prop.ForAll(ValidRequestArbitrary(), request =>
        {
            var emailService = Substitute.For<IEmailService>();
            var sut = new SubmitContactFormCommandHandler(emailService);

            var result = sut
                .Handle(new SubmitContactFormCommand(request), CancellationToken.None)
                .GetAwaiter()
                .GetResult();

            result.IsSuccess.Should().BeTrue(result.Error ?? "valid submissions should succeed");
            emailService.Received(1).SendContactFormEmailAsync(
                request.Email.Trim(),
                request.Name.Trim(),
                request.Subject.Trim(),
                request.Message.Trim(),
                Arg.Any<CancellationToken>());
            return true;
        });
    }

    // Feature: bymed-website, Property 37: Contact Form Confirmation
    [Property(MaxTest = 60)]
    public Property SuccessfulSubmission_ShouldReturnConfirmationPayload()
    {
        return Prop.ForAll(ValidRequestArbitrary(), request =>
        {
            var emailService = Substitute.For<IEmailService>();
            var sut = new SubmitContactFormCommandHandler(emailService);

            var result = sut
                .Handle(new SubmitContactFormCommand(request), CancellationToken.None)
                .GetAwaiter()
                .GetResult();

            result.IsSuccess.Should().BeTrue(result.Error ?? "successful submissions should return confirmation");
            result.Value.Should().NotBeNull();
            result.Value!.Name.Should().Be(request.Name.Trim());
            result.Value.Email.Should().Be(request.Email.Trim());
            result.Value.Subject.Should().Be(request.Subject.Trim());
            result.Value.Message.Should().Be(request.Message.Trim());
            result.Value.SubmittedAtUtc.Should().BeOnOrBefore(DateTime.UtcNow);
            return true;
        });
    }

    // Feature: bymed-website, Property 38: Contact Form Validation
    [Property(MaxTest = 80)]
    public Property InvalidEmail_ShouldRejectSubmission()
    {
        return Prop.ForAll(InvalidEmailRequestArbitrary(), request =>
        {
            var emailService = Substitute.For<IEmailService>();
            var sut = new SubmitContactFormCommandHandler(emailService);

            var result = sut
                .Handle(new SubmitContactFormCommand(request), CancellationToken.None)
                .GetAwaiter()
                .GetResult();

            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNullOrWhiteSpace();
            emailService.DidNotReceiveWithAnyArgs().SendContactFormEmailAsync(default!, default!, default!, default!, default);
            return true;
        });
    }

    // Feature: bymed-website, Property 40: Form Error Preservation
    [Property(MaxTest = 80)]
    public Property FailedSubmission_ShouldPreserveInputForResubmission()
    {
        return Prop.ForAll(InvalidEmailRequestArbitrary(), request =>
        {
            var emailService = Substitute.For<IEmailService>();
            var sut = new SubmitContactFormCommandHandler(emailService);
            var original = request with { };

            var result = sut
                .Handle(new SubmitContactFormCommand(request), CancellationToken.None)
                .GetAwaiter()
                .GetResult();

            result.IsSuccess.Should().BeFalse();
            request.Should().BeEquivalentTo(original, options => options.WithStrictOrdering());
            return true;
        });
    }
}
