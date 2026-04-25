using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.ClientTypes;

public sealed record GetClientTypesQuery : IRequest<IReadOnlyList<ClientTypeDto>>;
public sealed record GetClientTypeByIdQuery(Guid Id) : IRequest<Result<ClientTypeDto>>;
public sealed record CreateClientTypeCommand(CreateClientTypeRequest Request) : IRequest<Result<ClientTypeDto>>;
public sealed record UpdateClientTypeCommand(Guid Id, UpdateClientTypeRequest Request) : IRequest<Result<ClientTypeDto>>;
public sealed record DeleteClientTypeCommand(Guid Id) : IRequest<Result>;
