using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using MediatR;

namespace Bymed.Application.ClientTypes;

internal static class ClientTypeMapping
{
    public static ClientTypeDto ToDto(this ClientType entity) => new()
    {
        Id = entity.Id,
        Name = entity.Name,
        Slug = entity.Slug
    };
}

public sealed class GetClientTypesQueryHandler : IRequestHandler<GetClientTypesQuery, IReadOnlyList<ClientTypeDto>>
{
    private readonly IClientTypeRepository _clientTypeRepository;

    public GetClientTypesQueryHandler(IClientTypeRepository clientTypeRepository)
    {
        _clientTypeRepository = clientTypeRepository ?? throw new ArgumentNullException(nameof(clientTypeRepository));
    }

    public async Task<IReadOnlyList<ClientTypeDto>> Handle(GetClientTypesQuery request, CancellationToken cancellationToken)
    {
        var rows = await _clientTypeRepository.GetAllAsync(cancellationToken).ConfigureAwait(false);
        return rows.Select(x => x.ToDto()).ToList();
    }
}

public sealed class GetClientTypeByIdQueryHandler : IRequestHandler<GetClientTypeByIdQuery, Result<ClientTypeDto>>
{
    private readonly IClientTypeRepository _clientTypeRepository;

    public GetClientTypeByIdQueryHandler(IClientTypeRepository clientTypeRepository)
    {
        _clientTypeRepository = clientTypeRepository ?? throw new ArgumentNullException(nameof(clientTypeRepository));
    }

    public async Task<Result<ClientTypeDto>> Handle(GetClientTypeByIdQuery request, CancellationToken cancellationToken)
    {
        var row = await _clientTypeRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
        return row is null ? Result<ClientTypeDto>.Failure("Client type not found.") : Result<ClientTypeDto>.Success(row.ToDto());
    }
}

public sealed class CreateClientTypeCommandHandler : IRequestHandler<CreateClientTypeCommand, Result<ClientTypeDto>>
{
    private readonly IClientTypeRepository _clientTypeRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateClientTypeCommandHandler(IClientTypeRepository clientTypeRepository, IUnitOfWork unitOfWork)
    {
        _clientTypeRepository = clientTypeRepository ?? throw new ArgumentNullException(nameof(clientTypeRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<ClientTypeDto>> Handle(CreateClientTypeCommand request, CancellationToken cancellationToken)
    {
        var trimmedName = request.Request.Name.Trim();
        var trimmedSlug = request.Request.Slug.Trim().ToLowerInvariant();
        if (await _clientTypeRepository.ExistsByNameAsync(trimmedName, null, cancellationToken).ConfigureAwait(false))
            return Result<ClientTypeDto>.Failure("A client type with this name already exists.");
        if (await _clientTypeRepository.ExistsBySlugAsync(trimmedSlug, null, cancellationToken).ConfigureAwait(false))
            return Result<ClientTypeDto>.Failure("A client type with this slug already exists.");

        var entity = new ClientType(trimmedName, trimmedSlug);
        _clientTypeRepository.Add(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<ClientTypeDto>.Success(entity.ToDto());
    }
}

public sealed class UpdateClientTypeCommandHandler : IRequestHandler<UpdateClientTypeCommand, Result<ClientTypeDto>>
{
    private readonly IClientTypeRepository _clientTypeRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateClientTypeCommandHandler(IClientTypeRepository clientTypeRepository, IUnitOfWork unitOfWork)
    {
        _clientTypeRepository = clientTypeRepository ?? throw new ArgumentNullException(nameof(clientTypeRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<ClientTypeDto>> Handle(UpdateClientTypeCommand request, CancellationToken cancellationToken)
    {
        var entity = await _clientTypeRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
        if (entity is null)
            return Result<ClientTypeDto>.Failure("Client type not found.");

        var trimmedName = request.Request.Name.Trim();
        var trimmedSlug = request.Request.Slug.Trim().ToLowerInvariant();
        if (await _clientTypeRepository.ExistsByNameAsync(trimmedName, request.Id, cancellationToken).ConfigureAwait(false))
            return Result<ClientTypeDto>.Failure("A client type with this name already exists.");
        if (await _clientTypeRepository.ExistsBySlugAsync(trimmedSlug, request.Id, cancellationToken).ConfigureAwait(false))
            return Result<ClientTypeDto>.Failure("A client type with this slug already exists.");

        entity.Update(trimmedName, trimmedSlug);
        _clientTypeRepository.Update(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<ClientTypeDto>.Success(entity.ToDto());
    }
}

public sealed class DeleteClientTypeCommandHandler : IRequestHandler<DeleteClientTypeCommand, Result>
{
    private readonly IClientTypeRepository _clientTypeRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteClientTypeCommandHandler(IClientTypeRepository clientTypeRepository, IUnitOfWork unitOfWork)
    {
        _clientTypeRepository = clientTypeRepository ?? throw new ArgumentNullException(nameof(clientTypeRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result> Handle(DeleteClientTypeCommand request, CancellationToken cancellationToken)
    {
        var entity = await _clientTypeRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
        if (entity is null)
            return Result.Failure("Client type not found.");

        if (await _clientTypeRepository.HasClientsAsync(request.Id, cancellationToken).ConfigureAwait(false))
            return Result.Failure("Client type cannot be deleted because it is assigned to clients.");

        _clientTypeRepository.Remove(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result.Success();
    }
}
