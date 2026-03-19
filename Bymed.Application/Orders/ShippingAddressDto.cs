namespace Bymed.Application.Orders;

public sealed record ShippingAddressDto
{
    public required string Name { get; init; }
    public required string AddressLine1 { get; init; }
    public string? AddressLine2 { get; init; }
    public required string City { get; init; }
    public required string State { get; init; }
    public required string PostalCode { get; init; }
    public required string Country { get; init; }
    public required string Phone { get; init; }
}
