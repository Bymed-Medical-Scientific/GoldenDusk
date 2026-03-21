using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using MediatR;

namespace Bymed.Application.Users;

public sealed class AddUserAddressCommandHandler : IRequestHandler<AddUserAddressCommand, Result<UserAddressDto>>
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public AddUserAddressCommandHandler(IUserRepository userRepository, IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<UserAddressDto>> Handle(AddUserAddressCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken).ConfigureAwait(false);
        if (user is null)
            return Result<UserAddressDto>.Failure("User not found.");

        var addresses = await _userRepository.GetAddressesByUserIdAsync(request.UserId, cancellationToken).ConfigureAwait(false);
        if (request.Request.IsDefault)
        {
            foreach (var existing in addresses.Where(a => a.IsDefault))
                existing.ClearDefault();
        }

        var address = new Address(
            request.UserId,
            request.Request.Name,
            request.Request.AddressLine1,
            request.Request.AddressLine2,
            request.Request.City,
            request.Request.State,
            request.Request.PostalCode,
            request.Request.Country,
            request.Request.Phone,
            request.Request.IsDefault);

        _userRepository.AddAddress(address);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<UserAddressDto>.Success(UserMappings.ToAddressDto(address));
    }
}
