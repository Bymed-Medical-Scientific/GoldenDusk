using Asp.Versioning;
using Bymed.API.Authorization;
using Bymed.Application.Common;
using Bymed.Application.Products;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using System.Text;

namespace Bymed.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[Produces("application/json")]
public sealed class ProductsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IValidator<CreateProductRequest> _createValidator;
    private readonly IValidator<UpdateProductRequest> _updateValidator;
    private readonly IHostApplicationLifetime _hostApplicationLifetime;

    public ProductsController(
        IMediator mediator,
        IValidator<CreateProductRequest> createValidator,
        IValidator<UpdateProductRequest> updateValidator,
        IHostApplicationLifetime hostApplicationLifetime)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _createValidator = createValidator ?? throw new ArgumentNullException(nameof(createValidator));
        _updateValidator = updateValidator ?? throw new ArgumentNullException(nameof(updateValidator));
        _hostApplicationLifetime = hostApplicationLifetime ?? throw new ArgumentNullException(nameof(hostApplicationLifetime));
    }

    /// <summary>List products with optional filtering and pagination.</summary>
    /// <remarks>
    /// Uses <see cref="IHostApplicationLifetime.ApplicationStopping"/> for MediatR (not the request token) so
    /// client disconnects and aborted upstream fetches do not cancel EF/Redis catalog work.
    /// </remarks>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResult<ProductDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = PaginationParams.DefaultPageSize,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] string? search = null,
        [FromQuery] bool? inStock = null,
        [FromQuery] string? brand = null,
        [FromQuery] string? clientType = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null)
    {
        var query = new GetProductsQuery(pageNumber, pageSize, categoryId, search, inStock, brand, clientType, minPrice, maxPrice);
        var result = await _mediator.Send(query, _hostApplicationLifetime.ApplicationStopping).ConfigureAwait(false);
        return Ok(result);
    }

    /// <summary>Get a product by id.</summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _mediator.Send(new GetProductByIdQuery(id), _hostApplicationLifetime.ApplicationStopping).ConfigureAwait(false);
        if (!result.IsSuccess)
            return NotFound(new { error = result.Error });
        return Ok(result.Value);
    }

    /// <summary>Create a product (admin only).</summary>
    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest request, CancellationToken cancellationToken)
    {
        if (request is null)
            return BadRequest(new { error = "Invalid request." });

        var validation = await _createValidator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
        {
            var errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage });
            return BadRequest(new { errors });
        }

        var result = await _mediator.Send(new CreateProductCommand(request), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }

    /// <summary>Update a product (admin only).</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductRequest request, CancellationToken cancellationToken)
    {
        if (request is null)
            return BadRequest(new { error = "Invalid request." });

        var validation = await _updateValidator.ValidateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!validation.IsValid)
        {
            var errors = validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage });
            return BadRequest(new { errors });
        }

        var result = await _mediator.Send(new UpdateProductCommand(id, request), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
        {
            return result.Error is "Product not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>Delete (deactivate) a product (admin only).</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeleteProductCommand(id), cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
        {
            return result.Error is "Product not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    /// <summary>Bulk deactivate products (admin only).</summary>
    [HttpPost("bulk-delete")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(typeof(BulkOperationResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> BulkDelete([FromBody] BulkDeleteProductsRequest request, CancellationToken cancellationToken)
    {
        if (request is null || request.ProductIds.Count == 0)
            return BadRequest(new { error = "At least one product id is required." });

        var result = await _mediator
            .Send(new BulkDeleteProductsCommand(request.ProductIds), cancellationToken)
            .ConfigureAwait(false);

        return result.IsSuccess
            ? Ok(result.Value)
            : BadRequest(new { error = result.Error });
    }

    /// <summary>Bulk set availability for products (admin only).</summary>
    [HttpPatch("bulk-availability")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(typeof(BulkOperationResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> BulkAvailability([FromBody] BulkSetProductAvailabilityRequest request, CancellationToken cancellationToken)
    {
        if (request is null || request.ProductIds.Count == 0)
            return BadRequest(new { error = "At least one product id is required." });

        var result = await _mediator
            .Send(new BulkSetProductAvailabilityCommand(request.ProductIds, request.IsAvailable), cancellationToken)
            .ConfigureAwait(false);

        return result.IsSuccess
            ? Ok(result.Value)
            : BadRequest(new { error = result.Error });
    }

    /// <summary>Export products as CSV (admin only).</summary>
    [HttpGet("export")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Export([FromQuery] string? ids, CancellationToken cancellationToken)
    {
        IReadOnlyCollection<Guid>? productIds = null;
        if (!string.IsNullOrWhiteSpace(ids))
        {
            var rawIds = ids
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToArray();

            var parsedIds = new List<Guid>(rawIds.Length);
            foreach (var rawId in rawIds)
            {
                if (!Guid.TryParse(rawId, out var id))
                    return BadRequest(new { error = $"Invalid product id: {rawId}" });

                parsedIds.Add(id);
            }

            productIds = parsedIds;
        }

        var result = await _mediator
            .Send(new ExportProductsCsvQuery(productIds), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        var bytes = Encoding.UTF8.GetBytes(result.Value ?? string.Empty);
        return File(bytes, "text/csv", $"products-export-{DateTime.UtcNow:yyyyMMddHHmmss}.csv");
    }

    /// <summary>Import products from CSV (admin only).</summary>
    [HttpPost("import")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(typeof(ImportProductsResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Import(IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "CSV file is required." });

        await using var memory = new MemoryStream();
        await file.CopyToAsync(memory, cancellationToken).ConfigureAwait(false);

        var result = await _mediator
            .Send(new ImportProductsCsvCommand(memory.ToArray()), cancellationToken)
            .ConfigureAwait(false);

        return result.IsSuccess
            ? Ok(result.Value)
            : BadRequest(new { error = result.Error });
    }

    /// <summary>Upload an image for a product (admin only).</summary>
    [HttpPost("{id:guid}/images")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(typeof(ProductImageDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UploadImage(
        Guid id,
        IFormFile? file,
        [FromForm] string? altText,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Image file is required." });

        await using var memory = new MemoryStream();
        await file.CopyToAsync(memory, cancellationToken).ConfigureAwait(false);

        var command = new UploadProductImageCommand(
            id,
            memory.ToArray(),
            file.FileName,
            file.ContentType,
            altText);

        var result = await _mediator.Send(command, cancellationToken).ConfigureAwait(false);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(GetById), new { id }, result.Value);
    }

    /// <summary>Delete an image from a product (admin only).</summary>
    [HttpDelete("{id:guid}/images/{imageId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteImage(Guid id, Guid imageId, CancellationToken cancellationToken)
    {
        var result = await _mediator
            .Send(new DeleteProductImageCommand(id, imageId), cancellationToken)
            .ConfigureAwait(false);

        if (!result.IsSuccess)
        {
            return result.Error is "Product image not found."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        }

        return NoContent();
    }
}
