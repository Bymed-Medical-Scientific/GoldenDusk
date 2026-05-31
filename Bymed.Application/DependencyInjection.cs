using Bymed.Application.CatalogueItems;
using Bymed.Application.Categories;
using Bymed.Application.Orders;
using Bymed.Application.Products;
using Bymed.Application.Quotations;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace Bymed.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(typeof(GetCategoriesQueryHandler).Assembly));
        services.AddValidatorsFromAssemblyContaining<CreateCategoryRequestValidator>();
        services.AddScoped<IPricingCalculator, PricingCalculator>();
        services.AddScoped<ICatalogueLineItemResolver, CatalogueLineItemResolver>();
        services.AddScoped<ICatalogueItemSlugGenerator, CatalogueItemSlugGenerator>();
        services.AddScoped<IProductSlugGenerator, ProductSlugGenerator>();
        services.AddScoped<IOrderNumberGenerator, OrderNumberGenerator>();
        return services;
    }
}
