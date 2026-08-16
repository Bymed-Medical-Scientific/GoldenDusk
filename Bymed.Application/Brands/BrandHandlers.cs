using Bymed.Application.Caching;
using Bymed.Application.Common;
using Bymed.Application.Files;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using MediatR;

namespace Bymed.Application.Brands;

public sealed class GetBrandsQueryHandler : IRequestHandler<GetBrandsQuery, IReadOnlyList<BrandDto>>
{
    private readonly IBrandRepository _brandRepository;

    public GetBrandsQueryHandler(IBrandRepository brandRepository)
    {
        _brandRepository = brandRepository ?? throw new ArgumentNullException(nameof(brandRepository));
    }

    public async Task<IReadOnlyList<BrandDto>> Handle(GetBrandsQuery request, CancellationToken cancellationToken)
    {
        var brands = await _brandRepository.GetAllAsync(cancellationToken).ConfigureAwait(false);
        return brands.Select(ToDto).ToList();
    }

    internal static BrandDto ToDto(Brand brand) => new()
    {
        Id = brand.Id,
        Name = brand.Name,
        LogoUrl = brand.LogoUrl,
        WebsiteUrl = brand.WebsiteUrl,
    };
}

public sealed class GetBrandByIdQueryHandler : IRequestHandler<GetBrandByIdQuery, Result<BrandDto>>
{
    private readonly IBrandRepository _brandRepository;

    public GetBrandByIdQueryHandler(IBrandRepository brandRepository)
    {
        _brandRepository = brandRepository ?? throw new ArgumentNullException(nameof(brandRepository));
    }

    public async Task<Result<BrandDto>> Handle(GetBrandByIdQuery request, CancellationToken cancellationToken)
    {
        var brand = await _brandRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
        if (brand is null)
            return Result<BrandDto>.Failure("Brand not found.");

        return Result<BrandDto>.Success(GetBrandsQueryHandler.ToDto(brand));
    }
}

public sealed class CreateBrandCommandHandler : IRequestHandler<CreateBrandCommand, Result<BrandDto>>
{
    private readonly IBrandRepository _brandRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateBrandCommandHandler(IBrandRepository brandRepository, IUnitOfWork unitOfWork)
    {
        _brandRepository = brandRepository ?? throw new ArgumentNullException(nameof(brandRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<BrandDto>> Handle(CreateBrandCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;
        var name = req.Name.Trim();

        var nameExists = await _brandRepository
            .ExistsNameAsync(name, excludeBrandId: null, cancellationToken)
            .ConfigureAwait(false);
        if (nameExists)
            return Result<BrandDto>.Failure("A brand with this name already exists.");

        Brand brand;
        try
        {
            brand = new Brand(name, req.WebsiteUrl);
        }
        catch (ArgumentException ex)
        {
            return Result<BrandDto>.Failure(ex.Message);
        }

        _brandRepository.Add(brand);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<BrandDto>.Success(GetBrandsQueryHandler.ToDto(brand));
    }
}

public sealed class UpdateBrandCommandHandler : IRequestHandler<UpdateBrandCommand, Result<BrandDto>>
{
    private readonly IBrandRepository _brandRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICatalogueReadCache _catalogueReadCache;

    public UpdateBrandCommandHandler(
        IBrandRepository brandRepository,
        IUnitOfWork unitOfWork,
        ICatalogueReadCache catalogueReadCache)
    {
        _brandRepository = brandRepository ?? throw new ArgumentNullException(nameof(brandRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _catalogueReadCache = catalogueReadCache ?? throw new ArgumentNullException(nameof(catalogueReadCache));
    }

    public async Task<Result<BrandDto>> Handle(UpdateBrandCommand request, CancellationToken cancellationToken)
    {
        var brand = await _brandRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
        if (brand is null)
            return Result<BrandDto>.Failure("Brand not found.");

        var req = request.Request;
        var name = req.Name.Trim();

        var nameExists = await _brandRepository
            .ExistsNameAsync(name, excludeBrandId: request.Id, cancellationToken)
            .ConfigureAwait(false);
        if (nameExists)
            return Result<BrandDto>.Failure("A brand with this name already exists.");

        try
        {
            brand.Update(name, req.WebsiteUrl);
        }
        catch (ArgumentException ex)
        {
            return Result<BrandDto>.Failure(ex.Message);
        }

        _brandRepository.Update(brand);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await _catalogueReadCache.InvalidateAsync(cancellationToken).ConfigureAwait(false);

        return Result<BrandDto>.Success(GetBrandsQueryHandler.ToDto(brand));
    }
}

public sealed class DeleteBrandCommandHandler : IRequestHandler<DeleteBrandCommand, Result<Unit>>
{
    private readonly IBrandRepository _brandRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteBrandCommandHandler(
        IBrandRepository brandRepository,
        IFileStorageService fileStorageService,
        IUnitOfWork unitOfWork)
    {
        _brandRepository = brandRepository ?? throw new ArgumentNullException(nameof(brandRepository));
        _fileStorageService = fileStorageService ?? throw new ArgumentNullException(nameof(fileStorageService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<Result<Unit>> Handle(DeleteBrandCommand request, CancellationToken cancellationToken)
    {
        var brand = await _brandRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
        if (brand is null)
            return Result<Unit>.Failure("Brand not found.");

        var usageCount = await _brandRepository
            .CountCatalogueItemsAsync(request.Id, cancellationToken)
            .ConfigureAwait(false);
        if (usageCount > 0)
        {
            return Result<Unit>.Failure(
                $"Cannot delete this brand because {usageCount} catalogue item(s) are assigned to it.");
        }

        var logoUrl = brand.LogoUrl;
        _brandRepository.Remove(brand);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        if (!string.IsNullOrWhiteSpace(logoUrl))
            await _fileStorageService.DeleteFileAsync(logoUrl, cancellationToken).ConfigureAwait(false);

        return Result<Unit>.Success(Unit.Value);
    }
}

public sealed class UploadBrandLogoCommandHandler : IRequestHandler<UploadBrandLogoCommand, Result<BrandDto>>
{
    private readonly IBrandRepository _brandRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICatalogueReadCache _catalogueReadCache;

    public UploadBrandLogoCommandHandler(
        IBrandRepository brandRepository,
        IFileStorageService fileStorageService,
        IUnitOfWork unitOfWork,
        ICatalogueReadCache catalogueReadCache)
    {
        _brandRepository = brandRepository ?? throw new ArgumentNullException(nameof(brandRepository));
        _fileStorageService = fileStorageService ?? throw new ArgumentNullException(nameof(fileStorageService));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _catalogueReadCache = catalogueReadCache ?? throw new ArgumentNullException(nameof(catalogueReadCache));
    }

    public async Task<Result<BrandDto>> Handle(UploadBrandLogoCommand request, CancellationToken cancellationToken)
    {
        if (request.FileBytes is null || request.FileBytes.Length == 0)
            return Result<BrandDto>.Failure("Logo image file is required.");

        var brand = await _brandRepository.GetByIdAsync(request.BrandId, cancellationToken).ConfigureAwait(false);
        if (brand is null)
            return Result<BrandDto>.Failure("Brand not found.");

        var previousLogoUrl = brand.LogoUrl;

        await using var stream = new MemoryStream(request.FileBytes, writable: false);
        var stored = await _fileStorageService
            .SaveProductImageAsync(stream, request.FileName, request.ContentType, cancellationToken)
            .ConfigureAwait(false);

        if (!stored.IsSuccess || stored.Value is null)
            return Result<BrandDto>.Failure(stored.Error ?? "Failed to store logo image.");

        brand.SetLogoUrl(stored.Value.OriginalUrl);
        _brandRepository.Update(brand);
        await _unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await _catalogueReadCache.InvalidateAsync(cancellationToken).ConfigureAwait(false);

        if (!string.IsNullOrWhiteSpace(previousLogoUrl) && previousLogoUrl != brand.LogoUrl)
        {
            await _fileStorageService.DeleteFileAsync(previousLogoUrl, cancellationToken).ConfigureAwait(false);
        }

        return Result<BrandDto>.Success(GetBrandsQueryHandler.ToDto(brand));
    }
}
