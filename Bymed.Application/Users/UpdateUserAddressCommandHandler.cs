using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Users;

public sealed class UpdateUserAddressCommandHandler : IRequestHandler<UpdateUserAddressCommand, Result<UserAddressDto>>
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateUserAddressCommandHandler(IUserRepository userRepository, IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<UserAddressDto>> Handle(UpdateUserAddressCommand request, CancellationToken cancellationToken)
    {
        var address = await _userRepository.GetAddressByIdAsync(request.AddressId, cancellationToken).ConfigureAwait(false);
        if (address is null || address.UserId != request.UserId)
            return Result<UserAddressDto>.Failure("Address not found.");

        if (request.Request.IsDefault)
        {
            var addresses = await _userRepository.GetAddressesByUserIdAsync(request.UserId, cancellationToken).ConfigureAwait(false);
            foreach (var existing in addresses.Where(a => a.IsDefault && a.Id != address.Id))
                existing.ClearDefault();
        }

        address.Update(
            request.Request.Name,
            request.Request.AddressLine1,
            request.Request.AddressLine2,
            request.Request.City,
            request.Request.State,
            request.Request.PostalCode,
            request.Request.Country,
            request.Request.Phone,
            request.Request.IsDefault);

        _userRepository.UpdateAddress(address);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<UserAddressDto>.Success(UserMappings.ToAddressDto(address));
    }
}
