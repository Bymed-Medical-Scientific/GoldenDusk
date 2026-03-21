using AspNetCoreRateLimit;
using Bymed.API.Authorization;
using Bymed.API.Middleware;
using Bymed.Application;
using Bymed.Application.Auth;
using Bymed.Application.Notifications;
using Bymed.Infrastructure;
using Bymed.Infrastructure.Email;
using Bymed.Infrastructure.Identity;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Asp.Versioning;
using Microsoft.AspNetCore.Http.Timeouts;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Scalar.AspNetCore;
using Serilog;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

const long MaxRequestBodySizeBytes = 10L * 1024 * 1024; // 10MB
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = MaxRequestBodySizeBytes;
});

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = MaxRequestBodySizeBytes;
});

builder.Services.AddRequestTimeouts(options =>
{
    options.DefaultPolicy = new RequestTimeoutPolicy
    {
        Timeout = TimeSpan.FromSeconds(30),
        TimeoutStatusCode = StatusCodes.Status504GatewayTimeout
    };
});

builder.Host.UseSerilog((context, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration));

builder.Services.AddControllers();

var frontendCorsOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()?
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .ToArray() ?? Array.Empty<string>();

// In development, allow localhost if no origins configured
if (builder.Environment.IsDevelopment() && frontendCorsOrigins.Length == 0)
    frontendCorsOrigins = ["http://localhost:3000"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(frontendCorsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
})
.AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

builder.Services.AddOpenApi("v1", options =>
{
    options.AddDocumentTransformer((document, _, cancellationToken) =>
    {
        document.Info = new OpenApiInfo
        {
            Title = "Bymed API",
            Version = "v1",
            Description = "REST API for Bymed: authentication, admin, and customer operations. Use Bearer JWT from /api/v1/auth/login for protected endpoints."
        };
        document.Components ??= new OpenApiComponents();
        var components = document.Components;
        components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
        components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "JWT access token. Obtain from POST /api/v1/auth/login."
        };
        return Task.CompletedTask;
    });
});

// Application use cases (MediatR, FluentValidation)
builder.Services.AddApplication();

builder.Services.AddMemoryCache();

builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
builder.Services.Configure<IpRateLimitPolicies>(builder.Configuration.GetSection("IpRateLimitPolicies"));
builder.Services.AddInMemoryRateLimiting();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();

// Database and repositories (Clean Architecture Infrastructure)
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddHangfire(configuration =>
    configuration.UsePostgreSqlStorage(options =>
        options.UseNpgsqlConnection(builder.Configuration.GetConnectionString("DefaultConnection"))));
builder.Services.AddHangfireServer();
builder.Services.AddScoped<IEmailService, HangfireEmailService>();

// ASP.NET Core Identity with domain User entity (custom store)
builder.Services.AddIdentityCore<ApplicationUser>(options =>
{
    options.Password.RequiredLength = 8;
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.User.RequireUniqueEmail = true;
})
.AddUserStore<BymedUserStore>()
.AddDefaultTokenProviders();

builder.Services.AddBymedAuth();

// JWT authentication
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(JwtSettings.SectionName));

var jwtSection = builder.Configuration.GetSection(JwtSettings.SectionName);
var secretKey = jwtSection["SecretKey"];
if (string.IsNullOrWhiteSpace(secretKey))
    throw new InvalidOperationException("JWT SecretKey must be set (e.g. appsettings Jwt:SecretKey or environment variable Jwt__SecretKey).");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var issuer = jwtSection["Issuer"] ?? "BymedApi";
    var audience = jwtSection["Audience"] ?? "BymedApi";
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ValidateIssuer = true,
        ValidIssuer = issuer,
        ValidateAudience = true,
        ValidAudience = audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization(options => options.AddBymedRolePolicies());

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var ipPolicyStore = scope.ServiceProvider.GetRequiredService<IIpPolicyStore>();
    await ipPolicyStore.SeedAsync();
}

app.UseGlobalExceptionHandler();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options => options.WithTitle("Bymed API"));
}
else
{
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRequestTimeouts();
app.UseIpRateLimiting();
app.UseCors("FrontendPolicy");
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.UseHangfireDashboard("/hangfire");

app.MapControllers();

try
{
    await app.RunAsync();
}
finally
{
    await Log.CloseAndFlushAsync();
}
