# ─── Stage 1: Restore & Publish ───────────────────────────────────────────────
# NOTE: .NET 10 is in preview. If mcr.microsoft.com/dotnet/sdk:10.0 is not yet
#       available, use mcr.microsoft.com/dotnet/nightly/sdk:10.0 instead.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

# Copy project manifests first so dotnet restore is cached unless .csproj files change.
COPY Bymed.API/Bymed.API.csproj                  Bymed.API/
COPY Bymed.Application/Bymed.Application.csproj  Bymed.Application/
COPY Bymed.Domain/Bymed.Domain.csproj            Bymed.Domain/
COPY Bymed.Infrastructure/Bymed.Infrastructure.csproj Bymed.Infrastructure/

RUN dotnet restore Bymed.API/Bymed.API.csproj

COPY Bymed.API/            Bymed.API/
COPY Bymed.Application/    Bymed.Application/
COPY Bymed.Domain/         Bymed.Domain/
COPY Bymed.Infrastructure/ Bymed.Infrastructure/

RUN dotnet publish Bymed.API/Bymed.API.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

WORKDIR /app

# curl is used only for the HEALTHCHECK — keep the layer small.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

# Pre-create writable directories; contents are supplied via named volumes at runtime.
RUN mkdir -p wwwroot/uploads logs

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "Bymed.API.dll"]
