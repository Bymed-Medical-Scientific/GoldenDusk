using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using MediatR;

namespace Bymed.Application.Clients;

internal static class ClientMapping
{
    public static ClientContactPersonDto ToDto(this ClientContactPerson entity) => new()
    {
        Id = entity.Id,
        Name = entity.Name,
        Email = entity.Email,
        Phone = entity.Phone,
        Faculty = entity.Faculty
    };

    public static ClientDto ToDto(this Client entity, string? clientTypeName = null) => new()
    {
        Id = entity.Id,
        InstitutionName = entity.InstitutionName,
        Address = entity.Address,
        Email = entity.Email,
        Phone = entity.Phone,
        Telephone = entity.Telephone,
        ClientTypeId = entity.ClientTypeId,
        ClientTypeName = clientTypeName ?? entity.ClientType?.Name ?? string.Empty,
        ContactPersons = entity.ContactPersons.Select(x => x.ToDto()).ToList()
    };

    public static IReadOnlyList<ClientContactPersonInput> ToInputs(
        IReadOnlyList<ClientContactPersonRequest>? contactPersons) =>
        contactPersons?
            .Select(x => new ClientContactPersonInput(x.Name, x.Email, x.Phone, x.Faculty))
            .ToList() ?? [];
}

public sealed class GetClientsQueryHandler : IRequestHandler<GetClientsQuery, IReadOnlyList<ClientDto>>
{
    private readonly IClientRepository _clientRepository;

    public GetClientsQueryHandler(IClientRepository clientRepository)
    {
        _clientRepository = clientRepository ?? throw new ArgumentNullException(nameof(clientRepository));
    }

    public async Task<IReadOnlyList<ClientDto>> Handle(GetClientsQuery request, CancellationToken cancellationToken)
    {
        var rows = await _clientRepository
            .GetAllAsync(request.ClientTypeIds, cancellationToken)
            .ConfigureAwait(false);
        return rows.Select(x => x.ToDto()).ToList();
    }
}

public sealed class GetClientByIdQueryHandler : IRequestHandler<GetClientByIdQuery, Result<ClientDto>>
{
    private readonly IClientRepository _clientRepository;

    public GetClientByIdQueryHandler(IClientRepository clientRepository)
    {
        _clientRepository = clientRepository ?? throw new ArgumentNullException(nameof(clientRepository));
    }

    public async Task<Result<ClientDto>> Handle(GetClientByIdQuery request, CancellationToken cancellationToken)
    {
        var row = await _clientRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
        return row is null ? Result<ClientDto>.Failure("Client not found.") : Result<ClientDto>.Success(row.ToDto());
    }
}

public sealed class CreateClientCommandHandler : IRequestHandler<CreateClientCommand, Result<ClientDto>>
{
    private readonly IClientRepository _clientRepository;
    private readonly IClientTypeRepository _clientTypeRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateClientCommandHandler(
        IClientRepository clientRepository,
        IClientTypeRepository clientTypeRepository,
        IUnitOfWork unitOfWork)
    {
        _clientRepository = clientRepository ?? throw new ArgumentNullException(nameof(clientRepository));
        _clientTypeRepository = clientTypeRepository ?? throw new ArgumentNullException(nameof(clientTypeRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<ClientDto>> Handle(CreateClientCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;
        var institutionName = req.InstitutionName.Trim();

        if (await _clientRepository.ExistsInstitutionNameAsync(institutionName, null, cancellationToken).ConfigureAwait(false))
            return Result<ClientDto>.Failure("A client with this institution name already exists.");

        var clientType = await _clientTypeRepository.GetByIdAsync(req.ClientTypeId, cancellationToken).ConfigureAwait(false);
        if (clientType is null)
            return Result<ClientDto>.Failure("Client type not found.");

        var entity = new Client(
            req.InstitutionName,
            req.Address,
            req.ClientTypeId,
            req.Email,
            req.Phone,
            req.Telephone);

        entity.ReplaceContactPersons(ClientMapping.ToInputs(req.ContactPersons));

        _clientRepository.Add(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<ClientDto>.Success(entity.ToDto(clientType.Name));
    }
}

public sealed class UpdateClientCommandHandler : IRequestHandler<UpdateClientCommand, Result<ClientDto>>
{
    private readonly IClientRepository _clientRepository;
    private readonly IClientTypeRepository _clientTypeRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateClientCommandHandler(
        IClientRepository clientRepository,
        IClientTypeRepository clientTypeRepository,
        IUnitOfWork unitOfWork)
    {
        _clientRepository = clientRepository ?? throw new ArgumentNullException(nameof(clientRepository));
        _clientTypeRepository = clientTypeRepository ?? throw new ArgumentNullException(nameof(clientTypeRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<ClientDto>> Handle(UpdateClientCommand request, CancellationToken cancellationToken)
    {
        var entity = await _clientRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
        if (entity is null)
            return Result<ClientDto>.Failure("Client not found.");

        var req = request.Request;
        var institutionName = req.InstitutionName.Trim();
        if (await _clientRepository.ExistsInstitutionNameAsync(institutionName, request.Id, cancellationToken).ConfigureAwait(false))
            return Result<ClientDto>.Failure("A client with this institution name already exists.");

        var clientType = await _clientTypeRepository.GetByIdAsync(req.ClientTypeId, cancellationToken).ConfigureAwait(false);
        if (clientType is null)
            return Result<ClientDto>.Failure("Client type not found.");

        entity.Update(
            req.InstitutionName,
            req.Address,
            req.ClientTypeId,
            req.Email,
            req.Phone,
            req.Telephone);

        entity.ReplaceContactPersons(ClientMapping.ToInputs(req.ContactPersons));

        _clientRepository.Update(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<ClientDto>.Success(entity.ToDto(clientType.Name));
    }
}

public sealed class DeleteClientCommandHandler : IRequestHandler<DeleteClientCommand, Result>
{
    private readonly IClientRepository _clientRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteClientCommandHandler(IClientRepository clientRepository, IUnitOfWork unitOfWork)
    {
        _clientRepository = clientRepository ?? throw new ArgumentNullException(nameof(clientRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result> Handle(DeleteClientCommand request, CancellationToken cancellationToken)
    {
        var entity = await _clientRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
        if (entity is null)
            return Result.Failure("Client not found.");

        _clientRepository.Remove(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result.Success();
    }
}
