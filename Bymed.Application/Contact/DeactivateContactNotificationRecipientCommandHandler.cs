using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Contact;

public sealed class DeactivateContactNotificationRecipientCommandHandler
    : IRequestHandler<DeactivateContactNotificationRecipientCommand, Result>
{
    private readonly IContactNotificationRecipientRepository _recipientRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeactivateContactNotificationRecipientCommandHandler(
        IContactNotificationRecipientRepository recipientRepository,
        IUnitOfWork unitOfWork)
    {
        _recipientRepository = recipientRepository ?? throw new ArgumentNullException(nameof(recipientRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result> Handle(DeactivateContactNotificationRecipientCommand request, CancellationToken cancellationToken)
    {
        var recipient = await _recipientRepository.GetByIdAsync(request.RecipientId, cancellationToken).ConfigureAwait(false);
        if (recipient is null)
            return Result.Failure("Recipient not found.");

        recipient.Deactivate();
        _recipientRepository.Update(recipient);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result.Success();
    }
}
