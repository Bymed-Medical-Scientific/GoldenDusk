using System.Text.Json;
using Bymed.Domain.Entities;
using Bymed.Domain.Primitives;
using Bymed.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace Bymed.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
    public DbSet<Address> Addresses => Set<Address>();
    public DbSet<PageContent> PageContents => Set<PageContent>();
    public DbSet<ContentVersion> ContentVersions => Set<ContentVersion>();
    public DbSet<InventoryLog> InventoryLogs => Set<InventoryLog>();
    public DbSet<RefreshTokenEntity> RefreshTokens => Set<RefreshTokenEntity>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    public DbSet<ContactNotificationRecipient> ContactNotificationRecipients => Set<ContactNotificationRecipient>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        if (modelBuilder == null)
            throw new ArgumentNullException(nameof(modelBuilder));

        // Account is a domain primitive for audit; not mapped to a table.
        modelBuilder.Ignore<Account>();

        ApplyCategoryConfiguration(modelBuilder);
        ApplyProductConfiguration(modelBuilder);
        ApplyProductImageConfiguration(modelBuilder);
        ApplyUserConfiguration(modelBuilder);
        ApplyCartConfiguration(modelBuilder);
        ApplyCartItemConfiguration(modelBuilder);
        ApplyOrderConfiguration(modelBuilder);
        ApplyOrderItemConfiguration(modelBuilder);
        ApplyPaymentTransactionConfiguration(modelBuilder);
        ApplyAddressConfiguration(modelBuilder);
        ApplyPageContentConfiguration(modelBuilder);
        ApplyContentVersionConfiguration(modelBuilder);
        ApplyInventoryLogConfiguration(modelBuilder);
        ApplyRefreshTokenConfiguration(modelBuilder);
        ApplyContactMessageConfiguration(modelBuilder);
        ApplyContactNotificationRecipientConfiguration(modelBuilder);
    }

    private static void ApplyCategoryConfiguration(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => e.DisplayOrder);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(Category.NameMaxLength);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(Category.SlugMaxLength);
            entity.Property(e => e.Description).HasMaxLength(2000);
        });
    }

    private static void ApplyProductConfiguration(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => e.CategoryId);
            entity.HasIndex(e => e.IsAvailable);
            entity.HasIndex(e => e.Name);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(Product.NameMaxLength);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(Product.SlugMaxLength);
            entity.Property(e => e.Description);
            entity.Property(e => e.Price).HasPrecision(18, 2);
            entity.Property(e => e.Currency).HasMaxLength(Product.CurrencyMaxLength);
            entity.Property(e => e.Sku).HasMaxLength(Product.SkuMaxLength);
            entity.Property(e => e.Brand).HasMaxLength(Product.BrandMaxLength);
            entity.Property(e => e.ClientType).HasMaxLength(Product.ClientTypeMaxLength);
            entity.HasIndex(e => e.Brand);
            entity.HasIndex(e => e.ClientType);

            entity.HasOne(e => e.Category)
                .WithMany()
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.Property(e => e.Specifications)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => v == null ? null : JsonSerializer.Serialize(v),
                    v => string.IsNullOrEmpty(v) ? null : JsonSerializer.Deserialize<Dictionary<string, string>>(v));
        });
    }

    private static void ApplyProductImageConfiguration(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ProductId);
            entity.HasIndex(e => new { e.ProductId, e.DisplayOrder });

            entity.Property(e => e.Url).IsRequired().HasMaxLength(ProductImage.UrlMaxLength);
            entity.Property(e => e.AltText).IsRequired().HasMaxLength(ProductImage.AltTextMaxLength);

            entity.HasOne(e => e.Product)
                .WithMany()
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ApplyUserConfiguration(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(User.EmailMaxLength);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(User.NameMaxLength);
            entity.Property(e => e.AccessFailedCount).HasDefaultValue(0);
            entity.Property(e => e.LockoutEnd);
            entity.Property(e => e.LockoutEnabled).HasDefaultValue(true);
            entity.Property(e => e.EmailConfirmed).HasDefaultValue(false);
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasMany(e => e.Addresses)
                .WithOne(e => e.User)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ApplyCartConfiguration(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cart>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.SessionId);
            entity.Property(e => e.SessionId).HasMaxLength(Cart.SessionIdMaxLength);

            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ApplyCartItemConfiguration(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.HasIndex(e => new { e.CartId, e.ProductId }).IsUnique();
            entity.Property(e => e.PriceAtAdd).HasPrecision(18, 2);

            entity.HasOne(e => e.Cart)
                .WithMany(c => c.Items)
                .HasForeignKey(e => e.CartId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Product)
                .WithMany()
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ApplyOrderConfiguration(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.OrderNumber).IsUnique();
            entity.HasIndex(e => e.IdempotencyKey).IsUnique().HasFilter("\"IdempotencyKey\" IS NOT NULL");
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreationTime);

            entity.Property(e => e.OrderNumber).IsRequired().HasMaxLength(Order.OrderNumberMaxLength);
            entity.Property(e => e.IdempotencyKey).HasMaxLength(Order.IdempotencyKeyMaxLength);
            entity.Property(e => e.SessionId).HasMaxLength(Cart.SessionIdMaxLength);
            entity.HasIndex(e => e.SessionId);
            entity.Property(e => e.CustomerEmail).IsRequired().HasMaxLength(Order.CustomerEmailMaxLength);
            entity.Property(e => e.CustomerName).IsRequired().HasMaxLength(Order.CustomerNameMaxLength);
            entity.Property(e => e.Subtotal).HasPrecision(18, 2);
            entity.Property(e => e.Tax).HasPrecision(18, 2);
            entity.Property(e => e.ShippingCost).HasPrecision(18, 2);
            entity.Property(e => e.Total).HasPrecision(18, 2);
            entity.Property(e => e.Currency).HasMaxLength(Order.CurrencyMaxLength);
            entity.Property(e => e.ExchangeRate).HasPrecision(18, 6);
            entity.Property(e => e.PaymentReference).IsRequired().HasMaxLength(Order.PaymentReferenceMaxLength);
            entity.Property(e => e.PaymentMethod).IsRequired().HasMaxLength(Order.PaymentMethodMaxLength);
            entity.Property(e => e.TrackingNumber).HasMaxLength(Order.TrackingNumberMaxLength);
            entity.Property(e => e.Notes).HasMaxLength(Order.NotesMaxLength);

            entity.OwnsOne(e => e.ShippingAddress, sa =>
            {
                sa.Property(s => s.Name).HasMaxLength(200);
                sa.Property(s => s.AddressLine1).HasMaxLength(300);
                sa.Property(s => s.AddressLine2).HasMaxLength(300);
                sa.Property(s => s.City).HasMaxLength(100);
                sa.Property(s => s.State).HasMaxLength(100);
                sa.Property(s => s.PostalCode).HasMaxLength(20);
                sa.Property(s => s.Country).HasMaxLength(100);
                sa.Property(s => s.Phone).HasMaxLength(30);
            });

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }

    private static void ApplyOrderItemConfiguration(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.OrderId);
            entity.HasIndex(e => e.ProductId);

            entity.Property(e => e.ProductName).IsRequired().HasMaxLength(OrderItem.ProductNameMaxLength);
            entity.Property(e => e.ProductImageUrl).IsRequired().HasMaxLength(OrderItem.ProductImageUrlMaxLength);
            entity.Property(e => e.PricePerUnit).HasPrecision(18, 2);
            entity.Property(e => e.Subtotal).HasPrecision(18, 2);

            entity.HasOne(e => e.Order)
                .WithMany(o => o.Items)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Product)
                .WithMany()
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ApplyPaymentTransactionConfiguration(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PaymentTransaction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Reference).IsUnique();
            entity.HasIndex(e => e.PayNowReference);
            entity.HasIndex(e => e.Status);

            entity.Property(e => e.Reference).IsRequired().HasMaxLength(PaymentTransaction.ReferenceMaxLength);
            entity.Property(e => e.PayNowReference).HasMaxLength(PaymentTransaction.PayNowReferenceMaxLength);
            entity.Property(e => e.PollUrl).HasMaxLength(PaymentTransaction.UrlMaxLength);
            entity.Property(e => e.RedirectUrl).HasMaxLength(PaymentTransaction.UrlMaxLength);
            entity.Property(e => e.Currency).HasMaxLength(PaymentTransaction.CurrencyMaxLength);
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.Property(e => e.InitiationResponseRaw).HasMaxLength(PaymentTransaction.RawPayloadMaxLength);
            entity.Property(e => e.LastStatusUpdateRaw).HasMaxLength(PaymentTransaction.RawPayloadMaxLength);
        });
    }

    private static void ApplyAddressConfiguration(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Address>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);

            entity.Property(e => e.Name).IsRequired().HasMaxLength(Address.NameMaxLength);
            entity.Property(e => e.AddressLine1).IsRequired().HasMaxLength(Address.LineMaxLength);
            entity.Property(e => e.AddressLine2).HasMaxLength(Address.LineMaxLength);
            entity.Property(e => e.City).IsRequired().HasMaxLength(Address.CityMaxLength);
            entity.Property(e => e.State).IsRequired().HasMaxLength(Address.StateMaxLength);
            entity.Property(e => e.PostalCode).IsRequired().HasMaxLength(Address.PostalCodeMaxLength);
            entity.Property(e => e.Country).IsRequired().HasMaxLength(Address.CountryMaxLength);
            entity.Property(e => e.Phone).IsRequired().HasMaxLength(Address.PhoneMaxLength);

            entity.HasOne(e => e.User)
                .WithMany(u => u.Addresses)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ApplyPageContentConfiguration(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PageContent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => e.PublishedAt);

            entity.Property(e => e.Slug).IsRequired().HasMaxLength(PageContent.SlugMaxLength);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(PageContent.TitleMaxLength);
            entity.Property(e => e.Content).IsRequired();

            entity.OwnsOne(e => e.Metadata, m =>
            {
                m.Property(x => x.MetaTitle).HasMaxLength(PageMetadata.MetaTitleMaxLength);
                m.Property(x => x.MetaDescription).HasMaxLength(PageMetadata.MetaDescriptionMaxLength);
                m.Property(x => x.OgImage).HasMaxLength(PageMetadata.OgImageMaxLength);
            });
        });
    }

    private static void ApplyContentVersionConfiguration(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ContentVersion>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PageContentId);
            entity.HasIndex(e => e.CreatedAt);

            entity.Property(e => e.Content).IsRequired();
            entity.Property(e => e.CreatedBy).IsRequired().HasMaxLength(ContentVersion.CreatedByMaxLength);

            entity.HasOne(e => e.PageContent)
                .WithMany(p => p.Versions)
                .HasForeignKey(e => e.PageContentId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ApplyInventoryLogConfiguration(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<InventoryLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ProductId);
            entity.HasIndex(e => e.CreatedAt);

            entity.Property(e => e.Reason).IsRequired().HasMaxLength(InventoryLog.ReasonMaxLength);
            entity.Property(e => e.ChangedBy).IsRequired().HasMaxLength(InventoryLog.ChangedByMaxLength);

            entity.HasOne(e => e.Product)
                .WithMany()
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ApplyRefreshTokenConfiguration(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RefreshTokenEntity>(entity =>
        {
            entity.ToTable("RefreshTokens");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.TokenHash);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ExpiresAt);

            entity.Property(e => e.TokenHash).IsRequired().HasMaxLength(256);
        });
    }

    private static void ApplyContactMessageConfiguration(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ContactMessage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.SubmittedAtUtc);
            entity.HasIndex(e => e.Email);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(ContactMessage.NameMaxLength);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(ContactMessage.EmailMaxLength);
            entity.Property(e => e.Subject).IsRequired().HasMaxLength(ContactMessage.SubjectMaxLength);
            entity.Property(e => e.Message).IsRequired().HasMaxLength(ContactMessage.MessageMaxLength);
        });
    }

    private static void ApplyContactNotificationRecipientConfiguration(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ContactNotificationRecipient>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => new { e.IsPrimaryRecipient, e.IsActive });
            entity.Property(e => e.Email).IsRequired().HasMaxLength(ContactNotificationRecipient.EmailMaxLength);
        });
    }
}
