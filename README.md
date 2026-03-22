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