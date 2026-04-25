using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using MediatR;

namespace Bymed.Application.Currencies;

public sealed class CreateCurrencyDefinitionCommandHandler : IRequestHandler<CreateCurrencyDefinitionCommand, Result<CurrencyDefinitionDto>>
{
    private readonly ICurrencyDefinitionRepository _currencyDefinitionRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateCurrencyDefinitionCommandHandler(
        ICurrencyDefinitionRepository currencyDefinitionRepository,
        IUnitOfWork unitOfWork)
    {
        _currencyDefinitionRepository = currencyDefinitionRepository ?? throw new ArgumentNullException(nameof(currencyDefinitionRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<CurrencyDefinitionDto>> Handle(CreateCurrencyDefinitionCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;
        var isUnique = await _currencyDefinitionRepository
            .IsCodeUniqueAsync(req.Code, null, cancellationToken)
            .ConfigureAwait(false);
        if (!isUnique)
            return Result<CurrencyDefinitionDto>.Failure("A currency with this code already exists.");

        var currency = new CurrencyDefinition(req.Code, req.Name, req.Symbol ?? string.Empty, req.DecimalPlaces, req.IsActive);
        _currencyDefinitionRepository.Add(currency);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<CurrencyDefinitionDto>.Success(CurrencyMappings.ToDto(currency));
    }
}
