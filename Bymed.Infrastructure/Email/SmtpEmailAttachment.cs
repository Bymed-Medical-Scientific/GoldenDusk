namespace Bymed.Infrastructure.Email;

public sealed record SmtpEmailAttachment(string FileName, string ContentType, byte[] Content);
