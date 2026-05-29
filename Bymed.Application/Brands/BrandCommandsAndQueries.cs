using Bymed.Application.Common;
using MediatR;

namespace Bymed.Application.Brands;

public sealed record GetBrandsQuery : IRequest<IReadOnlyList<BrandDto>>;

public sealed record GetBrandByIdQuery(Guid Id) : IRequest<Result<BrandDto>>;

public sealed record CreateBrandCommand(CreateBrandRequest Request) : IRequest<Result<BrandDto>>;

public sealed record UpdateBrandCommand(Guid Id, UpdateBrandRequest Request) : IRequest<Result<BrandDto>>;

public sealed record DeleteBrandCommand(Guid Id) : IRequest<Result<Unit>>;

public sealed record UploadBrandLogoCommand(
    Guid BrandId,
    byte[] FileBytes,
    string FileName,
    string ContentType) : IRequest<Result<BrandDto>>;
