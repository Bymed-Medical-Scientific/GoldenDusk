using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Contact;

public sealed record CreateContactNotificationRecipientCommand(
    CreateContactNotificationRecipientRequest Request)
    : IRequest<Result<ContactNotificationRecipientDto>>;
