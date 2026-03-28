# GoldenDusk

## Production API configuration

Set these via environment variables or a secured `appsettings.Production.json` (never commit secrets):

| Setting | Notes |
|--------|--------|
| `ConnectionStrings__DefaultConnection` | PostgreSQL |
| `ConnectionStrings__Redis` or `Redis__ConnectionString` | **Required** outside Development (distributed cache, rate limits, catalog cache) |
| `Jwt__SecretKey` | Strong signing key (32+ chars) |
| `AllowedHosts` | Your public hostname(s); avoid `*` in production |
| `Hangfire__DashboardEnabled` | `false` unless you intentionally expose `/hangfire` (Admin JWT/cookie still required by `HangfireAdminAuthorizationFilter`) |

Health probe: `GET /health` (excluded from strict rate limits via `EndpointWhitelist` in `IpRateLimiting`).

## Local API development

`appsettings.json` keeps `ConnectionStrings:DefaultConnection` empty by design. For local runs, copy `Bymed.API/appsettings.Development.json.example` to `Bymed.API/appsettings.Development.json` (gitignored) and set your PostgreSQL connection string, or set the environment variable `ConnectionStrings__DefaultConnection`. Use `ASPNETCORE_ENVIRONMENT=Development` so the Development file is loaded (`dotnet run` from `Bymed.API` does this via `launchSettings.json`).