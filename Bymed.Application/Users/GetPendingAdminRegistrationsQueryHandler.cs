using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Users;

public sealed class GetPendingAdminRegistrationsQueryHandler
    : IRequestHandler<GetPendingAdminRegistrationsQuery, IReadOnlyList<PendingAdminRegistrationDto>>
{
    private readonly IUserRepository _userRepository;

    public GetPendingAdminRegistrationsQueryHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
    }

    public async Task<IReadOnlyList<PendingAdminRegistrationDto>> Handle(
        GetPendingAdminRegistrationsQuery request,
        CancellationToken cancellationToken)
    {
        var users = await _userRepository.GetPendingAdminRegistrationsAsync(cancellationToken).ConfigureAwait(false);

        return users
            .Select(user => new PendingAdminRegistrationDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                EmailConfirmed = user.EmailConfirmed,
                CreationTime = user.CreationTime
            })
            .ToList();
    }
}
