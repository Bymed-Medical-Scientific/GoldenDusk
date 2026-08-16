namespace Bymed.API.Configuration;

/// <summary>
/// Loads repo-root <c>.env</c> for local Development so PayNow and other secrets match Docker's PAYNOW_* variables.
/// Does not override variables already set in the process environment.
/// </summary>
internal static class DevelopmentEnvLoader
{
    private static readonly (string EnvKey, string AspNetKey)[] PayNowAliases =
    [
        ("PAYNOW_INTEGRATION_ID", "PayNow__IntegrationId"),
        ("PAYNOW_INTEGRATION_KEY", "PayNow__IntegrationKey"),
        ("PAYNOW_INITIATE_TRANSACTION_URL", "PayNow__InitiateTransactionUrl"),
        ("PAYNOW_STOREFRONT_BASE_URL", "PayNow__StorefrontBaseUrl"),
        ("PAYNOW_RESULT_URL", "PayNow__ResultUrl"),
    ];

    public static void LoadIfDevelopment()
    {
        var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        if (!string.Equals(env, "Development", StringComparison.OrdinalIgnoreCase))
            return;

        var envFile = FindEnvFile();
        if (envFile is null)
            return;

        foreach (var (key, value) in ParseEnvFile(envFile))
            SetIfUnset(key, value);

        foreach (var (envKey, aspNetKey) in PayNowAliases)
        {
            var value = Environment.GetEnvironmentVariable(envKey);
            if (!string.IsNullOrWhiteSpace(value))
                SetIfUnset(aspNetKey, value.Trim());
        }

        SetIfUnset(
            "PayNow__InitiateTransactionUrl",
            "https://www.paynow.co.zw/interface/initiatetransaction");
    }

    private static string? FindEnvFile()
    {
        var dir = new DirectoryInfo(Directory.GetCurrentDirectory());
        while (dir is not null)
        {
            var candidate = Path.Combine(dir.FullName, ".env");
            if (File.Exists(candidate))
                return candidate;

            var hasSolution = dir.GetFiles("*.sln").Length > 0;
            var hasCompose = File.Exists(Path.Combine(dir.FullName, "docker-compose.yml"));
            if (hasSolution || hasCompose)
            {
                var atRoot = Path.Combine(dir.FullName, ".env");
                return File.Exists(atRoot) ? atRoot : null;
            }

            dir = dir.Parent;
        }

        return null;
    }

    private static IEnumerable<(string Key, string Value)> ParseEnvFile(string path)
    {
        foreach (var rawLine in File.ReadLines(path))
        {
            var line = rawLine.Trim();
            if (line.Length == 0 || line[0] == '#')
                continue;

            var idx = line.IndexOf('=');
            if (idx <= 0)
                continue;

            var key = line[..idx].Trim();
            var value = line[(idx + 1)..].Trim();
            if (value.Length >= 2 && value[0] == '"' && value[^1] == '"')
                value = value[1..^1];
            else if (value.Length >= 2 && value[0] == '\'' && value[^1] == '\'')
                value = value[1..^1];

            if (key.Length > 0)
                yield return (key, value);
        }
    }

    private static void SetIfUnset(string key, string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return;

        var existing = Environment.GetEnvironmentVariable(key);
        if (!string.IsNullOrWhiteSpace(existing))
            return;

        Environment.SetEnvironmentVariable(key, value);
    }
}
