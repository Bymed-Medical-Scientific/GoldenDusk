using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Clients;

public sealed record GetClientsQuery : IRequest<IReadOnlyList<ClientDto>>;
public sealed record GetClientByIdQuery(Guid Id) : IRequest<Result<ClientDto>>;
public sealed record CreateClientCommand(CreateClientRequest Request) : IRequest<Result<ClientDto>>;
public sealed record UpdateClientCommand(Guid Id, UpdateClientRequest Request) : IRequest<Result<ClientDto>>;
public sealed record DeleteClientCommand(Guid Id) : IRequest<Result>;
