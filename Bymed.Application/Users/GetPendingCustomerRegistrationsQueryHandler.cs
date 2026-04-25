using Bymed.Application.Repositories;
using MediatR;

namespace Bymed.Application.Users;

public sealed class GetPendingCustomerRegistrationsQueryHandler
    : IRequestHandler<GetPendingCustomerRegistrationsQuery, IReadOnlyList<PendingCustomerRegistrationDto>>
{
    private readonly IUserRepository _userRepository;

    public GetPendingCustomerRegistrationsQueryHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
    }

    public async Task<IReadOnlyList<PendingCustomerRegistrationDto>> Handle(GetPendingCustomerRegistrationsQuery request, CancellationToken cancellationToken)
    {
        var users = await _userRepository.GetPendingCustomerRegistrationsAsync(cancellationToken).ConfigureAwait(false);
        return users.Select(user => new PendingCustomerRegistrationDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            EmailConfirmed = user.EmailConfirmed,
            CreationTime = user.CreationTime
        }).ToList();
    }
}
