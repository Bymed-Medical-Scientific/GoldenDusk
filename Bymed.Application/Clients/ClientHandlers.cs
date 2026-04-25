using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using MediatR;

namespace Bymed.Application.Clients;

internal static class ClientMapping
{
    public static ClientDto ToDto(this Client entity, string? clientTypeName = null) => new()
    {
        Id = entity.Id,
        InstitutionName = entity.InstitutionName,
        Address = entity.Address,
        Email1 = entity.Email1,
        Email2 = entity.Email2,
        Email3 = entity.Email3,
        PhoneNumber1 = entity.PhoneNumber1,
        PhoneNumber2 = entity.PhoneNumber2,
        PhoneNumber3 = entity.PhoneNumber3,
        TelephoneNumber1 = entity.TelephoneNumber1,
        TelephoneNumber2 = entity.TelephoneNumber2,
        TelephoneNumber3 = entity.TelephoneNumber3,
        ContactPerson1Name = entity.ContactPerson1Name,
        ContactPerson1Email = entity.ContactPerson1Email,
        ContactPerson1Telephone = entity.ContactPerson1Telephone,
        ContactPerson2Name = entity.ContactPerson2Name,
        ContactPerson2Email = entity.ContactPerson2Email,
        ContactPerson2Telephone = entity.ContactPerson2Telephone,
        ClientTypeId = entity.ClientTypeId,
        ClientTypeName = clientTypeName ?? entity.ClientType?.Name ?? string.Empty
    };
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
        var rows = await _clientRepository.GetAllAsync(cancellationToken).ConfigureAwait(false);
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

        var entity = CreateEntity(req);
        _clientRepository.Add(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<ClientDto>.Success(entity.ToDto(clientType.Name));
    }

    private static Client CreateEntity(CreateClientRequest req) =>
        new(
            req.InstitutionName,
            req.Address,
            req.ClientTypeId,
            req.Email1,
            req.Email2,
            req.Email3,
            req.PhoneNumber1,
            req.PhoneNumber2,
            req.PhoneNumber3,
            req.TelephoneNumber1,
            req.TelephoneNumber2,
            req.TelephoneNumber3,
            req.ContactPerson1Name,
            req.ContactPerson1Email,
            req.ContactPerson1Telephone,
            req.ContactPerson2Name,
            req.ContactPerson2Email,
            req.ContactPerson2Telephone);
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
            req.Email1,
            req.Email2,
            req.Email3,
            req.PhoneNumber1,
            req.PhoneNumber2,
            req.PhoneNumber3,
            req.TelephoneNumber1,
            req.TelephoneNumber2,
            req.TelephoneNumber3,
            req.ContactPerson1Name,
            req.ContactPerson1Email,
            req.ContactPerson1Telephone,
            req.ContactPerson2Name,
            req.ContactPerson2Email,
            req.ContactPerson2Telephone);

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
