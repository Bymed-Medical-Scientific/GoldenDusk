using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Infrastructure.Persistence;
using Bymed.Infrastructure.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace Bymed.Infrastructure;

/// <summary>
/// Registers Infrastructure services: repositories and unit of work.
/// Call after adding ApplicationDbContext to the service collection.
/// </summary>
public static class DependencyInjection
{
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
