using AspNetCoreRateLimit;

using Bymed.API.Authorization;

using Bymed.API.Hangfire;

using Bymed.API.Middleware;

using Bymed.Application;

using Bymed.Application.Auth;

using Bymed.Application.Notifications;

using Bymed.Infrastructure;

using Bymed.Infrastructure.Email;

using Bymed.Infrastructure.Identity;

using Hangfire;

using Hangfire.Dashboard;

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

using System.Text.Json.Serialization;



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



builder.Services.AddControllers()

    .AddJsonOptions(options =>

    {

        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());

    });



var frontendCorsOrigins = builder.Configuration

    .GetSection("Cors:AllowedOrigins")

    .Get<string[]>()?

    .Where(origin => !string.IsNullOrWhiteSpace(origin))

    .ToArray() ?? Array.Empty<string>();



// In development, allow common local dev servers if no origins configured (Next.js :3000, Angular :4200)

if (builder.Environment.IsDevelopment() && frontendCorsOrigins.Length == 0)

    frontendCorsOrigins =

    [

        "http://localhost:3000",

        "https://localhost:3000",

        "http://localhost:4200",

        "https://localhost:4200"

    ];



builder.Services.AddCors(options =>

{

    options.AddPolicy("FrontendPolicy", policy =>

    {

        policy.WithOrigins(frontendCorsOrigins)

            .AllowAnyHeader()

            .AllowAnyMethod()

            .AllowCredentials();

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



var defaultConnection = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(defaultConnection))

{

    throw new InvalidOperationException(

        "ConnectionStrings:DefaultConnection is required (appsettings or ConnectionStrings__DefaultConnection).");

}



var redisConnection = builder.Configuration.GetConnectionString("Redis");

if (string.IsNullOrWhiteSpace(redisConnection))

    redisConnection = builder.Configuration["Redis:ConnectionString"]?.Trim();

if (string.IsNullOrWhiteSpace(redisConnection))

    redisConnection = null;



if (!builder.Environment.IsDevelopment() && string.IsNullOrWhiteSpace(redisConnection))

{

    throw new InvalidOperationException(

        "Redis is required outside Development for distributed cache and rate limiting. " +

        "Set ConnectionStrings:Redis or Redis:ConnectionString.");

}



if (!string.IsNullOrWhiteSpace(redisConnection))

{

    builder.Services.AddStackExchangeRedisCache(options => options.Configuration = redisConnection);

}

else

{

    builder.Services.AddDistributedMemoryCache();

}



builder.Services.AddMemoryCache();



builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));

builder.Services.Configure<IpRateLimitPolicies>(builder.Configuration.GetSection("IpRateLimitPolicies"));

builder.Services.AddDistributedRateLimiting();

builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();



var healthChecks = builder.Services.AddHealthChecks()

    .AddNpgSql(defaultConnection, name: "postgresql", tags: ["ready"]);



if (!string.IsNullOrWhiteSpace(redisConnection))

    healthChecks.AddRedis(redisConnection, name: "redis", tags: ["ready"]);



// Application use cases (MediatR, FluentValidation)

builder.Services.AddApplication();



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

    options.Password.RequiredLength = PasswordPolicy.MinimumLength;

    options.Password.RequireDigit = true;

    options.Password.RequireLowercase = true;

    options.Password.RequireUppercase = true;

    options.Password.RequireNonAlphanumeric = true;

    options.User.RequireUniqueEmail = true;

    options.Lockout.AllowedForNewUsers = true;

    options.Lockout.MaxFailedAccessAttempts = 5;

    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);

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



var hangfireDashboardEnabled = builder.Configuration.GetValue("Hangfire:DashboardEnabled", builder.Environment.IsDevelopment());



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



if (hangfireDashboardEnabled)

{

    app.UseHangfireDashboard("/hangfire", new DashboardOptions

    {

        Authorization = [new HangfireAdminAuthorizationFilter()]

    });

}



app.MapHealthChecks("/health");

app.MapControllers();



try

{

    await app.RunAsync();

}

finally

{

    await Log.CloseAndFlushAsync();

}


