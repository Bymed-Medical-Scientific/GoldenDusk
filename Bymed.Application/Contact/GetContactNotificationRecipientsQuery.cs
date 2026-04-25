using MediatR;

namespace Bymed.Application.Contact;

public sealed record GetContactNotificationRecipientsQuery : IRequest<IReadOnlyList<ContactNotificationRecipientDto>>;
