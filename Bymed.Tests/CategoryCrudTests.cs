using Bymed.Application.Categories;
using Bymed.Application.Common;
using Bymed.Application.Persistence;
using Bymed.Application.Repositories;
using Bymed.Domain.Entities;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Bymed.Tests;

/// <summary>
/// Unit tests for category CRUD operations (handlers).
/// Validates: Requirements 6.2
/// </summary>
public class CategoryCrudTests
{
    private static ICategoryRepository CreateCategoryRepository() => Substitute.For<ICategoryRepository>();
    private static IUnitOfWork CreateUnitOfWork() => Substitute.For<IUnitOfWork>();

    [Fact]
    public async Task GetCategoriesQuery_ReturnsOrderedList()
    {
        var category = new Category("Lab Equipment", "lab-equipment", "Description", 1);
        var repo = CreateCategoryRepository();
        repo.GetAllOrderedByDisplayOrderAsync(Arg.Any<CancellationToken>())
            .Returns(new[] { category });

        var handler = new GetCategoriesQueryHandler(repo);
        var result = await handler.Handle(new GetCategoriesQuery(), CancellationToken.None);

        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        result[0].Name.Should().Be("Lab Equipment");
        result[0].Slug.Should().Be("lab-equipment");
        result[0].DisplayOrder.Should().Be(1);
    }

    [Fact]
    public async Task GetCategoriesQuery_WhenEmpty_ReturnsEmptyList()
    {
        var repo = CreateCategoryRepository();
        repo.GetAllOrderedByDisplayOrderAsync(Arg.Any<CancellationToken>()).Returns(Array.Empty<Category>());

        var handler = new GetCategoriesQueryHandler(repo);
        var result = await handler.Handle(new GetCategoriesQuery(), CancellationToken.None);

        result.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public async Task GetCategoryByIdQuery_WhenExists_ReturnsDto()
    {
        var id = Guid.NewGuid();
        var category = new Category("Medical", "medical", null, 0);
        var repo = CreateCategoryRepository();
        repo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns(category);

        var handler = new GetCategoryByIdQueryHandler(repo);
        var result = await handler.Handle(new GetCategoryByIdQuery(id), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Id.Should().Be(category.Id);
        result.Value.Name.Should().Be("Medical");
        result.Value.Slug.Should().Be("medical");
    }

    [Fact]
    public async Task GetCategoryByIdQuery_WhenNotExists_ReturnsFailure()
    {
        var id = Guid.NewGuid();
        var repo = CreateCategoryRepository();
        repo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Category?)null);

        var handler = new GetCategoryByIdQueryHandler(repo);
        var result = await handler.Handle(new GetCategoryByIdQuery(id), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Category not found.");
    }

    [Fact]
    public async Task CreateCategoryCommand_WhenSlugUnique_CreatesAndReturnsDto()
    {
        var repo = CreateCategoryRepository();
        repo.ExistsSlugAsync(Arg.Any<string>(), null, Arg.Any<CancellationToken>()).Returns(false);
        var unitOfWork = CreateUnitOfWork();
        unitOfWork.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);

        var request = new CreateCategoryRequest
        {
            Name = "Consumables",
            Slug = "consumables",
            Description = "Consumable items",
            DisplayOrder = 2
        };
        var handler = new CreateCategoryCommandHandler(repo, unitOfWork);
        var result = await handler.Handle(new CreateCategoryCommand(request), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Name.Should().Be("Consumables");
        result.Value.Slug.Should().Be("consumables");
        result.Value.Description.Should().Be("Consumable items");
        result.Value.DisplayOrder.Should().Be(2);
        repo.Received(1).Add(Arg.Is<Category>(c => c.Name == "Consumables" && c.Slug == "consumables"));
        await unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateCategoryCommand_WhenSlugExists_ReturnsFailure()
    {
        var repo = CreateCategoryRepository();
        repo.ExistsSlugAsync(Arg.Any<string>(), null, Arg.Any<CancellationToken>()).Returns(true);
        var unitOfWork = CreateUnitOfWork();

        var request = new CreateCategoryRequest
        {
            Name = "Dupe",
            Slug = "existing-slug",
            Description = null,
            DisplayOrder = 0
        };
        var handler = new CreateCategoryCommandHandler(repo, unitOfWork);
        var result = await handler.Handle(new CreateCategoryCommand(request), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("A category with this slug already exists.");
        repo.DidNotReceive().Add(Arg.Any<Category>());
        await unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateCategoryCommand_WhenExistsAndSlugUnique_UpdatesAndReturnsDto()
    {
        var id = Guid.NewGuid();
        var category = new Category("Old Name", "old-slug", "Old desc", 0);
        var repo = CreateCategoryRepository();
        repo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns(category);
        repo.ExistsSlugAsync(Arg.Any<string>(), id, Arg.Any<CancellationToken>()).Returns(false);
        var unitOfWork = CreateUnitOfWork();
        unitOfWork.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);

        var request = new UpdateCategoryRequest
        {
            Name = "New Name",
            Slug = "new-slug",
            Description = "New desc",
            DisplayOrder = 1
        };
        var handler = new UpdateCategoryCommandHandler(repo, unitOfWork);
        var result = await handler.Handle(new UpdateCategoryCommand(id, request), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Name.Should().Be("New Name");
        result.Value.Slug.Should().Be("new-slug");
        category.Name.Should().Be("New Name");
        category.Slug.Should().Be("new-slug");
        repo.Received(1).Update(category);
        await unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateCategoryCommand_WhenNotExists_ReturnsFailure()
    {
        var id = Guid.NewGuid();
        var repo = CreateCategoryRepository();
        repo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Category?)null);
        var unitOfWork = CreateUnitOfWork();

        var request = new UpdateCategoryRequest
        {
            Name = "Any",
            Slug = "any-slug",
            Description = null,
            DisplayOrder = 0
        };
        var handler = new UpdateCategoryCommandHandler(repo, unitOfWork);
        var result = await handler.Handle(new UpdateCategoryCommand(id, request), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Category not found.");
        repo.DidNotReceive().Update(Arg.Any<Category>());
        await unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateCategoryCommand_WhenSlugTakenByOther_ReturnsFailure()
    {
        var id = Guid.NewGuid();
        var category = new Category("Mine", "my-slug", null, 0);
        var repo = CreateCategoryRepository();
        repo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns(category);
        repo.ExistsSlugAsync("other-slug", id, Arg.Any<CancellationToken>()).Returns(true);
        var unitOfWork = CreateUnitOfWork();

        var request = new UpdateCategoryRequest
        {
            Name = "Mine",
            Slug = "other-slug",
            Description = null,
            DisplayOrder = 0
        };
        var handler = new UpdateCategoryCommandHandler(repo, unitOfWork);
        var result = await handler.Handle(new UpdateCategoryCommand(id, request), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("A category with this slug already exists.");
        await unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteCategoryCommand_WhenNoProducts_DeletesAndReturnsSuccess()
    {
        var id = Guid.NewGuid();
        var category = new Category("To Delete", "to-delete", null, 0);
        var repo = CreateCategoryRepository();
        repo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns(category);
        repo.HasProductsAsync(id, Arg.Any<CancellationToken>()).Returns(false);
        var unitOfWork = CreateUnitOfWork();
        unitOfWork.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);

        var handler = new DeleteCategoryCommandHandler(repo, unitOfWork);
        var result = await handler.Handle(new DeleteCategoryCommand(id), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        repo.Received(1).Remove(category);
        await unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteCategoryCommand_WhenHasProducts_ReturnsFailure()
    {
        var id = Guid.NewGuid();
        var category = new Category("With Products", "with-products", null, 0);
        var repo = CreateCategoryRepository();
        repo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns(category);
        repo.HasProductsAsync(id, Arg.Any<CancellationToken>()).Returns(true);
        var unitOfWork = CreateUnitOfWork();

        var handler = new DeleteCategoryCommandHandler(repo, unitOfWork);
        var result = await handler.Handle(new DeleteCategoryCommand(id), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Cannot delete category because it has products assigned. Reassign or remove the products first.");
        repo.DidNotReceive().Remove(Arg.Any<Category>());
        await unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteCategoryCommand_WhenNotExists_ReturnsFailure()
    {
        var id = Guid.NewGuid();
        var repo = CreateCategoryRepository();
        repo.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Category?)null);
        var unitOfWork = CreateUnitOfWork();

        var handler = new DeleteCategoryCommandHandler(repo, unitOfWork);
        var result = await handler.Handle(new DeleteCategoryCommand(id), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Category not found.");
        repo.DidNotReceive().Remove(Arg.Any<Category>());
        await unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
