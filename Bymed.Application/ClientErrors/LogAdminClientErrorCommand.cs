using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.ClientErrors;

public sealed record LogAdminClientErrorCommand(LogAdminClientErrorRequest Request) : IRequest<Result>;
