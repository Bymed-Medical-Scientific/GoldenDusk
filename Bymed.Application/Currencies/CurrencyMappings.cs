using Bymed.Domain.Entities;

namespace Bymed.Application.Currencies;

public static class CurrencyMappings
{
    public static CurrencyDefinitionDto ToDto(CurrencyDefinition currency) =>
        new()
        {
            Id = currency.Id,
            Code = currency.Code,
            Name = currency.Name,
            Symbol = currency.Symbol,
            DecimalPlaces = currency.DecimalPlaces,
            IsActive = currency.IsActive
        };
}
