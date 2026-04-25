using Bymed.Application.Quotations;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Bymed.Tests;

public sealed class ExportQuotationPdfQueryHandlerTests
{
    [Fact]
    public async Task Handle_WhenQuotationExists_ReturnsPdfBytes()
    {
        var quotation = new Quotation(
            "Q-20260425-5511",
            "Jane Doe",
            "Hospital A",
            "jane@example.com",
            "+263711111111",
            "Harare",
            "Quotation Subject",
            "USD",
            15.5m,
            true,
            null,
            "Terms",
            DateTime.UtcNow);
        quotation.AddItem(Guid.NewGuid(), "Item 1", "SKU-11", null, 1, 10m, "USD", 1m, 2m);

        var quotationRepository = Substitute.For<IQuotationRepository>();
        quotationRepository.GetByIdAsync(quotation.Id, Arg.Any<CancellationToken>()).Returns(quotation);

        var renderer = Substitute.For<IQuotationPdfRenderer>();
        renderer.RenderAsync(Arg.Any<QuotationDto>(), Arg.Any<CancellationToken>())
            .Returns(Bymed.Application.Common.Result<byte[]>.Success([1, 2, 3]));

        var sut = new ExportQuotationPdfQueryHandler(quotationRepository, renderer);
        var result = await sut.Handle(new ExportQuotationPdfQuery(quotation.Id), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Equal([1, 2, 3]);
    }
}
