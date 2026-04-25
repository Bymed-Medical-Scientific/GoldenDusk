using Bymed.Domain.Entities;

namespace Bymed.Application.Repositories;

public interface ICurrencyDefinitionRepository
{
    void Add(CurrencyDefinition currencyDefinition);
    Task<CurrencyDefinition?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<CurrencyDefinition?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CurrencyDefinition>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<bool> IsCodeUniqueAsync(string code, Guid? excludeId, CancellationToken cancellationToken = default);
    void Remove(CurrencyDefinition currencyDefinition);
}
