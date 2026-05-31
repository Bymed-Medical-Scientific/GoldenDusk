# GoldenDusk

## Production API configuration

Set these via environment variables or a secured `appsettings.Production.json` (never commit secrets):

| Setting | Notes |
|--------|--------|
| `ConnectionStrings__DefaultConnection` | PostgreSQL |
| `ConnectionStrings__Redis` or `Redis__ConnectionString` | **Required** outside Development (distributed cache, rate limits, catalog cache) |
| `Jwt__SecretKey` | Strong signing key (32+ chars) |
| `PayNow__IntegrationId`, `PayNow__IntegrationKey` | PayNow merchant credentials (from `.env` / `PAYNOW_*`) |
| `PayNow__StorefrontBaseUrl` | Storefront origin for return URLs (e.g. `https://bymed.co.zw`) |
| `PayNow__ResultUrl` | Public HTTPS webhook URL (`/api/v1/Payments/webhook`) |
| `AllowedHosts` | Your public hostname(s); avoid `*` in production |
| `Hangfire__DashboardEnabled` | `false` unless you intentionally expose `/hangfire` (Admin JWT/cookie still required by `HangfireAdminAuthorizationFilter`) |

Health probe: `GET /health` (excluded from strict rate limits via `EndpointWhitelist` in `IpRateLimiting`).

## Local API development

`appsettings.json` keeps `ConnectionStrings:DefaultConnection` empty by design. For local runs, copy `Bymed.API/appsettings.Development.json.example` to `Bymed.API/appsettings.Development.json` (gitignored) and set your PostgreSQL connection string, or set the environment variable `ConnectionStrings__DefaultConnection`. Use `ASPNETCORE_ENVIRONMENT=Development` so the Development file is loaded (`dotnet run` from `Bymed.API` does this via `launchSettings.json`).

PayNow credentials are **not** in the appsettings example: copy the repo root `.env.example` to `.env` and set `PAYNOW_*` (Docker Compose injects them as `PayNow__*`). For `dotnet run` without Docker, export the same `PayNow__*` environment variables or use [User Secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets).


--settings--
docker compose build --no-cache
docker compose up -d 