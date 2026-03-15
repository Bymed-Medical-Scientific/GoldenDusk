using Bymed.Application.Categories;
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
        return services;
    }
}
