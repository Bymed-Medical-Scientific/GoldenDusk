using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Users;

public sealed class SetDefaultUserAddressCommandHandler : IRequestHandler<SetDefaultUserAddressCommand, Result<UserAddressDto>>
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public SetDefaultUserAddressCommandHandler(IUserRepository userRepository, IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<UserAddressDto>> Handle(SetDefaultUserAddressCommand request, CancellationToken cancellationToken)
    {
        var address = await _userRepository.GetAddressByIdAsync(request.AddressId, cancellationToken).ConfigureAwait(false);
        if (address is null || address.UserId != request.UserId)
            return Result<UserAddressDto>.Failure("Address not found.");

        var addresses = await _userRepository.GetAddressesByUserIdAsync(request.UserId, cancellationToken).ConfigureAwait(false);
        foreach (var existing in addresses)
        {
            if (existing.Id == address.Id)
                existing.SetAsDefault();
            else if (existing.IsDefault)
                existing.ClearDefault();
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<UserAddressDto>.Success(UserMappings.ToAddressDto(address));
    }
}
