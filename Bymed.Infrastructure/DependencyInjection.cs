using Bymed.Application.Auth;
using Bymed.Application.Caching;
using Bymed.Application.Currency;
using Bymed.Application.Files;
using Bymed.Application.Notifications;
using Bymed.Application.Payments;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Infrastructure.Currency;
using Bymed.Infrastructure.Email;
using Bymed.Infrastructure.Auth;
using Bymed.Infrastructure.Caching;
using Bymed.Infrastructure.Files;
using Bymed.Infrastructure.Payments;
using Bymed.Infrastructure.Persistence;
using Bymed.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Bymed.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException(
                "Connection string 'DefaultConnection' is not configured. " +
                "Set it in appsettings.Development.json (local) or environment variable ConnectionStrings__DefaultConnection.");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.Configure<FileStorageOptions>(configuration.GetSection(FileStorageOptions.SectionName));
        services.AddScoped<IFileStorageService, LocalFileStorageService>();
        services.Configure<EmailOptions>(configuration.GetSection(EmailOptions.SectionName));
        services.AddOptions<EmailOptions>()
            .Bind(configuration.GetSection(EmailOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.Configure<PayNowOptions>(configuration.GetSection(PayNowOptions.SectionName));
        services.AddHttpClient<PayNowPaymentService>();
        services.AddScoped<IPaymentService, PayNowPaymentService>();

        services.Configure<CurrencyOptions>(configuration.GetSection(CurrencyOptions.SectionName));
        services.AddHttpClient<CurrencyService>();
        services.AddScoped<ICurrencyService, CurrencyService>();

        return services.AddInfrastructureRepositories();
    }

    public static IServiceCollection AddInfrastructureRepositories(this IServiceCollection services)
    {
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IProductImageRepository, ProductImageRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<ICartRepository, CartRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IInventoryLogRepository, InventoryLogRepository>();
        services.AddScoped<IPaymentTransactionRepository, PaymentTransactionRepository>();
        services.AddScoped<IPageContentRepository, PageContentRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        if (!services.Any(d => d.ServiceType == typeof(IDistributedCache)))
            services.AddDistributedMemoryCache();

        services.AddSingleton<ICatalogReadCache, DistributedCatalogReadCache>();
        return services;
    }

    public static IServiceCollection AddBymedAuth(this IServiceCollection services)
    {
        services.AddScoped<IRefreshTokenStore, RefreshTokenStore>();
        services.AddScoped<IEmailSender, NoOpEmailSender>();
        services.AddScoped<ISmtpEmailSender, SmtpEmailSender>();
        services.AddScoped<IEmailBackgroundJobRunner, EmailBackgroundJobRunner>();
        services.TryAddScoped<IEmailService, NoOpEmailService>();
        services.AddScoped<IAuthService, AuthService>();
        return services;
    }
}
