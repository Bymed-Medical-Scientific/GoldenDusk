using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Enums;
using MediatR;

namespace Bymed.Application.Users;

public sealed class ApprovePendingAdminRegistrationCommandHandler : IRequestHandler<ApprovePendingAdminRegistrationCommand, Result>
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ApprovePendingAdminRegistrationCommandHandler(IUserRepository userRepository, IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result> Handle(ApprovePendingAdminRegistrationCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.PendingUserId, cancellationToken).ConfigureAwait(false);
        if (user is null)
            return Result.Failure("User not found.");

        if (user.Role != UserRole.Admin)
            return Result.Failure("Only admin accounts can be approved with this action.");

        if (user.IsActive)
            return Result.Failure("This account is already active.");

        user.SetActive(true);
        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result.Success();
    }
}
