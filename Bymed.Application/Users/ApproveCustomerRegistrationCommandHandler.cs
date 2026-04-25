using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Enums;
using MediatR;

namespace Bymed.Application.Users;

public sealed class ApproveCustomerRegistrationCommandHandler : IRequestHandler<ApproveCustomerRegistrationCommand, Result>
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ApproveCustomerRegistrationCommandHandler(IUserRepository userRepository, IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result> Handle(ApproveCustomerRegistrationCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken).ConfigureAwait(false);
        if (user is null)
            return Result.Failure("User not found.");
        if (user.Role != UserRole.Customer)
            return Result.Failure("Only customer accounts can be approved with this action.");
        if (!user.EmailConfirmed)
            return Result.Failure("This customer account must verify email before approval.");

        user.SetActive(true);
        user.SetCanViewPrices(request.CanViewPrices);
        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result.Success();
    }
}
