using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Contact;

public sealed record SubmitContactFormCommand(SubmitContactFormRequest Request) : IRequest<Result<ContactFormDto>>;
