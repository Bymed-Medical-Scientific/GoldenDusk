using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Contact;

public sealed record DeactivateContactNotificationRecipientCommand(Guid RecipientId) : IRequest<Result>;
