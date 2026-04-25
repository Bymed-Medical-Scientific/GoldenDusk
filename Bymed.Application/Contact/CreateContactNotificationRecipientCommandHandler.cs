using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using MediatR;

namespace Bymed.Application.Contact;

public sealed class CreateContactNotificationRecipientCommandHandler
    : IRequestHandler<CreateContactNotificationRecipientCommand, Result<ContactNotificationRecipientDto>>
{
    private readonly IContactNotificationRecipientRepository _recipientRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateContactNotificationRecipientCommandHandler(
        IContactNotificationRecipientRepository recipientRepository,
        IUnitOfWork unitOfWork)
    {
        _recipientRepository = recipientRepository ?? throw new ArgumentNullException(nameof(recipientRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<ContactNotificationRecipientDto>> Handle(
        CreateContactNotificationRecipientCommand request,
        CancellationToken cancellationToken)
    {
        var email = request.Request.Email.Trim();
        if (await _recipientRepository.ExistsByEmailAsync(email, cancellationToken).ConfigureAwait(false))
            return Result<ContactNotificationRecipientDto>.Failure("Recipient already exists.");

        var entity = new ContactNotificationRecipient(email, request.Request.IsPrimaryRecipient);
        _recipientRepository.Add(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<ContactNotificationRecipientDto>.Success(new ContactNotificationRecipientDto
        {
            Id = entity.Id,
            Email = entity.Email,
            IsPrimaryRecipient = entity.IsPrimaryRecipient,
            IsActive = entity.IsActive,
            CreatedAtUtc = entity.CreatedAtUtc
        });
    }
}
