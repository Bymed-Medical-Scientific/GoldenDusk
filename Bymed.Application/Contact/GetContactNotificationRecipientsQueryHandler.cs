using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Contact;

public sealed class GetContactNotificationRecipientsQueryHandler
    : IRequestHandler<GetContactNotificationRecipientsQuery, IReadOnlyList<ContactNotificationRecipientDto>>
{
    private readonly IContactNotificationRecipientRepository _recipientRepository;

    public GetContactNotificationRecipientsQueryHandler(IContactNotificationRecipientRepository recipientRepository)
    {
        _recipientRepository = recipientRepository ?? throw new ArgumentNullException(nameof(recipientRepository));
    }

    public async Task<IReadOnlyList<ContactNotificationRecipientDto>> Handle(
        GetContactNotificationRecipientsQuery request,
        CancellationToken cancellationToken)
    {
        var items = await _recipientRepository.GetAllAsync(cancellationToken).ConfigureAwait(false);
        return items.Select(x => new ContactNotificationRecipientDto
        {
            Id = x.Id,
            Email = x.Email,
            IsPrimaryRecipient = x.IsPrimaryRecipient,
            IsActive = x.IsActive,
            CreatedAtUtc = x.CreatedAtUtc
        }).ToList();
    }
}
