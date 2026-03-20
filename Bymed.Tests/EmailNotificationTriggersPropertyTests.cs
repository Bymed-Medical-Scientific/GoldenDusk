using Bymed.Infrastructure.Email;
using FluentAssertions;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Hangfire;
using Hangfire.Common;
using Hangfire.States;
using NSubstitute;

namespace Bymed.Tests;

/// <summary>
/// Property 10: Email Notification Triggers.
/// For any valid notification payload, email methods must enqueue exactly one background job.
/// Validates: Requirements 3.6, 7.4, 13.1, 13.2, 13.3
/// </summary>
public class EmailNotificationTriggersPropertyTests
{
    [Property(MaxTest = 40)]
    public Property EmailMethods_EnqueueExactlyOneBackgroundJob()
    {
        var nonEmptyGen = ArbMap.Default.GeneratorFor<string>()
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim());

        var scenarioArb = (from toEmail in nonEmptyGen
            from customerName in nonEmptyGen
            from orderNumber in nonEmptyGen
            from tracking in nonEmptyGen
            from subject in nonEmptyGen
            from message in nonEmptyGen
            from resetLink in nonEmptyGen
            from mode in ArbMap.Default.GeneratorFor<int>().Where(n => n >= 0 && n <= 4)
            select new
            {
                ToEmail = $"{toEmail.Replace(" ", "").ToLowerInvariant()}@example.com",
                CustomerName = customerName,
                OrderNumber = orderNumber,
                Tracking = tracking,
                Subject = subject,
                Message = message,
                ResetLink = $"https://example.com/reset?token={Uri.EscapeDataString(resetLink)}",
                Mode = mode
            }).ToArbitrary();

        return Prop.ForAll(scenarioArb, s =>
        {
            var jobs = Substitute.For<IBackgroundJobClient>();
            jobs.Create(Arg.Any<Job>(), Arg.Any<IState>()).Returns("job-id");
            var sut = new HangfireEmailService(jobs);

            switch (s.Mode)
            {
                case 0:
                    sut.SendOrderConfirmationAsync(s.ToEmail, s.CustomerName, s.OrderNumber).GetAwaiter().GetResult();
                    jobs.Received(1).Create(
                        Arg.Is<Job>(job => job.Method.Name == nameof(IEmailBackgroundJobRunner.SendOrderConfirmationAsync)),
                        Arg.Any<EnqueuedState>());
                    break;
                case 1:
                    sut.SendShippingNotificationAsync(s.ToEmail, s.CustomerName, s.OrderNumber, s.Tracking).GetAwaiter().GetResult();
                    jobs.Received(1).Create(
                        Arg.Is<Job>(job => job.Method.Name == nameof(IEmailBackgroundJobRunner.SendShippingNotificationAsync)),
                        Arg.Any<EnqueuedState>());
                    break;
                case 2:
                    sut.SendDeliveryConfirmationAsync(s.ToEmail, s.CustomerName, s.OrderNumber).GetAwaiter().GetResult();
                    jobs.Received(1).Create(
                        Arg.Is<Job>(job => job.Method.Name == nameof(IEmailBackgroundJobRunner.SendDeliveryConfirmationAsync)),
                        Arg.Any<EnqueuedState>());
                    break;
                case 3:
                    sut.SendContactFormEmailAsync(s.ToEmail, s.CustomerName, s.Subject, s.Message).GetAwaiter().GetResult();
                    jobs.Received(1).Create(
                        Arg.Is<Job>(job => job.Method.Name == nameof(IEmailBackgroundJobRunner.SendContactFormEmailAsync)),
                        Arg.Any<EnqueuedState>());
                    break;
                default:
                    sut.SendPasswordResetEmailAsync(s.ToEmail, s.CustomerName, s.ResetLink).GetAwaiter().GetResult();
                    jobs.Received(1).Create(
                        Arg.Is<Job>(job => job.Method.Name == nameof(IEmailBackgroundJobRunner.SendPasswordResetEmailAsync)),
                        Arg.Any<EnqueuedState>());
                    break;
            }

            jobs.ReceivedCalls().Count().Should().Be(1);
            return true;
        });
    }
}
