using Bymed.Domain.Entities;

namespace Bymed.Application.Users;

internal static class UserMappings
{
    public static UserProfileDto ToProfileDto(User user)
    {
        ArgumentNullException.ThrowIfNull(user);

        var addresses = user.Addresses
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.Id)
            .Select(ToAddressDto)
            .ToList()
            .AsReadOnly();

        return new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name,
            IsActive = user.IsActive,
            CanViewPrices = user.CanViewPrices,
            Addresses = addresses
        };
    }

    public static UserAddressDto ToAddressDto(Address address)
    {
        ArgumentNullException.ThrowIfNull(address);

        return new UserAddressDto
        {
            Id = address.Id,
            Name = address.Name,
            AddressLine1 = address.AddressLine1,
            AddressLine2 = address.AddressLine2,
            City = address.City,
            State = address.State,
            PostalCode = address.PostalCode,
            Country = address.Country,
            Phone = address.Phone,
            IsDefault = address.IsDefault
        };
    }
}
