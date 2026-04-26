using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Currencies;

public sealed class DeleteCurrencyDefinitionCommandHandler : IRequestHandler<DeleteCurrencyDefinitionCommand, Result>
{
    private readonly ICurrencyDefinitionRepository _currencyDefinitionRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteCurrencyDefinitionCommandHandler(
        ICurrencyDefinitionRepository currencyDefinitionRepository,
        IUnitOfWork unitOfWork)
    {
        _currencyDefinitionRepository = currencyDefinitionRepository ?? throw new ArgumentNullException(nameof(currencyDefinitionRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result> Handle(DeleteCurrencyDefinitionCommand request, CancellationToken cancellationToken)
    {
        var currency = await _currencyDefinitionRepository.GetByIdAsync(request.CurrencyDefinitionId, cancellationToken).ConfigureAwait(false);
        if (currency is null)
            return Result.Failure("Currency not found.");

        _currencyDefinitionRepository.Remove(currency);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result.Success();
    }
}
