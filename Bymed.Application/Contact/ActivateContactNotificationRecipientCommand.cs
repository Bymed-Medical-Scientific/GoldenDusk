using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Contact;

public sealed record ActivateContactNotificationRecipientCommand(Guid RecipientId) : IRequest<Result>;
