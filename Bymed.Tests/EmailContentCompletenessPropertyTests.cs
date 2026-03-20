using Bymed.Infrastructure.Email;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NSubstitute;

namespace Bymed.Tests;

/// <summary>
/// Property 35: Email Content Completeness.
/// For any valid input, generated email subject/body must include required domain information.
/// Validates: Requirements 13.4
/// </summary>
public class EmailContentCompletenessPropertyTests
{
    [Property(MaxTest = 40)]
    public Property Templates_ContainRequiredInformation()
    {
        var nonEmptyGen = ArbMap.Default.GeneratorFor<string>()
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim());

        var scenarioArb = (from toEmail in nonEmptyGen
            from customerName in nonEmptyGen
            from orderNumber in nonEmptyGen
            from trackingNumber in nonEmptyGen
            from senderName in nonEmptyGen
            from subject in nonEmptyGen
            from message in nonEmptyGen
            from token in nonEmptyGen
            select new
            {
                ToEmail = $"{toEmail.Replace(" ", "").ToLowerInvariant()}@example.com",
                CustomerName = customerName,
                OrderNumber = orderNumber,
                TrackingNumber = trackingNumber,
                SenderName = senderName,
                Subject = subject,
                Message = message,
                ResetLink = $"https://example.com/reset?token={Uri.EscapeDataString(token)}"
            }).ToArbitrary();

        return Prop.ForAll(scenarioArb, s =>
        {
            var smtp = Substitute.For<ISmtpEmailSender>();
            var options = Options.Create(new EmailOptions
            {
                FromAddress = "no-reply@example.com",
                FromName = "Bymed",
                Host = "smtp.example.com",
                Port = 587,
                UseSsl = true,
                Username = "user",
                Password = "secret",
                ContactFormRecipient = "support@example.com",
                PasswordResetBaseUrl = "https://example.com/reset-password"
            });

            var sut = new EmailBackgroundJobRunner(smtp, options, NullLogger<EmailBackgroundJobRunner>.Instance);

            sut.SendOrderConfirmationAsync(s.ToEmail, s.CustomerName, s.OrderNumber).GetAwaiter().GetResult();
            smtp.Received().SendEmailAsync(
                s.ToEmail,
                Arg.Is<string>(subject => subject.Contains(s.OrderNumber, StringComparison.Ordinal)),
                Arg.Is<string>(body =>
                    body.Contains(s.CustomerName, StringComparison.Ordinal) &&
                    body.Contains(s.OrderNumber, StringComparison.Ordinal)),
                Arg.Any<CancellationToken>());

            sut.SendShippingNotificationAsync(s.ToEmail, s.CustomerName, s.OrderNumber, s.TrackingNumber).GetAwaiter().GetResult();
            smtp.Received().SendEmailAsync(
                s.ToEmail,
                Arg.Is<string>(subject => subject.Contains("on the way", StringComparison.OrdinalIgnoreCase)),
                Arg.Is<string>(body =>
                    body.Contains(s.OrderNumber, StringComparison.Ordinal) &&
                    body.Contains(s.TrackingNumber, StringComparison.Ordinal)),
                Arg.Any<CancellationToken>());

            sut.SendDeliveryConfirmationAsync(s.ToEmail, s.CustomerName, s.OrderNumber).GetAwaiter().GetResult();
            smtp.Received().SendEmailAsync(
                s.ToEmail,
                Arg.Is<string>(subject => subject.Contains("Delivered", StringComparison.OrdinalIgnoreCase)),
                Arg.Is<string>(body =>
                    body.Contains(s.CustomerName, StringComparison.Ordinal) &&
                    body.Contains(s.OrderNumber, StringComparison.Ordinal)),
                Arg.Any<CancellationToken>());

            sut.SendContactFormEmailAsync(s.ToEmail, s.SenderName, s.Subject, s.Message).GetAwaiter().GetResult();
            smtp.Received().SendEmailAsync(
                "support@example.com",
                Arg.Is<string>(emailSubject => emailSubject.Contains(s.Subject, StringComparison.Ordinal)),
                Arg.Is<string>(body =>
                    body.Contains(s.SenderName, StringComparison.Ordinal) &&
                    body.Contains(s.ToEmail, StringComparison.Ordinal)),
                Arg.Any<CancellationToken>());

            sut.SendPasswordResetEmailAsync(s.ToEmail, s.CustomerName, s.ResetLink).GetAwaiter().GetResult();
            smtp.Received().SendEmailAsync(
                s.ToEmail,
                Arg.Is<string>(subject => subject.Contains("Reset your password", StringComparison.OrdinalIgnoreCase)),
                Arg.Is<string>(body =>
                    body.Contains(s.CustomerName, StringComparison.Ordinal) &&
                    body.Contains(s.ResetLink, StringComparison.Ordinal)),
                Arg.Any<CancellationToken>());

            return true;
        });
    }
}
