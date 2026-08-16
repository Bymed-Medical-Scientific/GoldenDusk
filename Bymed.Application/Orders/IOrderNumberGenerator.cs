namespace Bymed.Application.Orders;

public interface IOrderNumberGenerator
{
    Task<string> GenerateAsync(string customerName, CancellationToken cancellationToken = default);
}
