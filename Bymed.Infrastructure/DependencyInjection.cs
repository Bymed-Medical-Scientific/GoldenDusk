using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Infrastructure.Persistence;
using Bymed.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Bymed.Infrastructure;

/// <summary>
/// Registers Infrastructure services: DbContext, repositories, and unit of work.
/// </summary>
public static class DependencyInjection
{
    /// <summary>
    /// Registers ApplicationDbContext (PostgreSQL) and all repositories. Call from API startup.
    /// </summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString));

        return services.AddInfrastructureRepositories();
    }

    /// <summary>
    /// Registers repositories and unit of work. Call after adding ApplicationDbContext.
    /// </summary>
    public static IServiceCollection AddInfrastructureRepositories(this IServiceCollection services)
    {
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<ICartRepository, CartRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        return services;
    }
}
