namespace Bymed.Application.Files;

public sealed record StoredMarketingAsset(string RelativePath, string FileName, string ContentType, long SizeBytes);
