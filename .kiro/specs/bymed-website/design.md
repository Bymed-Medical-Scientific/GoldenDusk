# Design Document: Bymed Medical & Scientific Website

## Overview

The Bymed website is a full-stack e-commerce platform designed to serve the African medical equipment market. The system consists of three primary components: a customer-facing storefront built with Next.js for browsing and purchasing products, an Angular-based administrative panel for managing content and operations, and a C# backend API using Clean Architecture that orchestrates business logic, data persistence, and third-party integrations.

The architecture prioritizes security, performance, and maintainability while supporting the unique requirements of the African market including multi-currency support, reliable payment processing through PayNow (Zimbabwean payment gateway), and responsive design for varying network conditions.

### Key Design Goals

- **Security First**: Protect customer data and payment information through encryption, secure authentication, and industry-standard security practices
- **Performance**: Deliver fast page loads even on slower connections common in African markets
- **Scalability**: Support growth from initial launch to handling thousands of concurrent users
- **Maintainability**: Enable non-technical staff to manage content, products, and orders through an intuitive CMS
- **Reliability**: Ensure high availability and graceful degradation when third-party services fail
- **Clean Architecture**: Maintain clear separation of concerns with independent, testable layers

## Architecture

### System Architecture

The system follows a modern multi-tier architecture with clear separation between frontend applications and backend services:

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client Layer                                │
├──────────────────────────────┬──────────────────────────────────────┤
│   Customer Frontend          │      Admin Panel                     │
│   (Next.js 14+ SSR/SSG)      │      (Angular 17+)                   │
│   - Product browsing         │      - Product management            │
│   - Shopping cart            │      - Order management              │
│   - Checkout                 │      - Content management            │
│   - User accounts            │      - Inventory tracking            │
└──────────────────────────────┴──────────────────────────────────────┘
                                    │
                                    ↓ HTTPS/REST API
┌─────────────────────────────────────────────────────────────────────┐
│                       Backend API Layer                              │
│                    (ASP.NET Core Web API)                            │
├─────────────────────────────────────────────────────────────────────┤
│                      Clean Architecture Layers                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Presentation Layer (API Controllers)                      │    │
│  │  - ProductsController, OrdersController, AuthController    │    │
│  └────────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Application Layer (Use Cases / Services)                  │    │
│  │  - CreateProductUseCase, ProcessOrderUseCase                 │    │
│  │  - Business logic orchestration                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Domain Layer (Entities, Value Objects, Domain Services)   │    │
│  │  - Product, Order, User, Category entities                 │    │
│  │  - Business rules and domain logic                         │    │
│  └────────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Infrastructure Layer (Data Access, External Services)     │    │
│  │  - EF Core repositories, PayNow integration                │    │
│  │  - Email service, file storage                             │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
┌──────────────────────────────┐  ┌────────────────────────────────┐
│   Data & Services Layer      │  │   External Services            │
├──────────────────────────────┤  ├────────────────────────────────┤
│  ┌────────────────────────┐  │  │  ┌──────────────────────────┐ │
│  │  PostgreSQL Database   │  │  │  │  PayNow Payment Gateway  │ │
│  │  - Products            │  │  │  │  (Zimbabwean)            │ │
│  │  - Categories          │  │  │  └──────────────────────────┘ │
│  │  - Orders              │  │  │  ┌──────────────────────────┐ │
│  │  - Users               │  │  │  │  Email Service           │ │
│  └────────────────────────┘  │  │  │  (SendGrid/SMTP)         │ │
│  ┌────────────────────────┐  │  │  └──────────────────────────┘ │
│  │  Redis Cache           │  │  │  ┌──────────────────────────┐ │
│  │  (Optional)            │  │  │  │  File Storage            │ │
│  └────────────────────────┘  │  │  │  (Local/S3/Azure Blob)   │ │
└──────────────────────────────┘  │  └──────────────────────────┘ │
                                  └────────────────────────────────┘
```

### Technology Stack

#### Customer Frontend
**Framework**: Next.js 14+ with App Router
- Server-side rendering (SSR) for product pages to improve SEO
- Static site generation (SSG) for content pages to maximize performance
- React Server Components for optimal bundle sizes
- TypeScript for type safety

**Styling**: Tailwind CSS
- Utility-first approach for rapid development
- Responsive design out of the box
- Easy customization for Bymed branding

#### Admin Panel
**Framework**: Angular 17+ (Standalone Components)
- Component-based architecture
- TypeScript for type safety
- RxJS for reactive programming
- Angular Material or PrimeNG for UI components

**Features**:
- Product management interface
- Order management and tracking
- Content management system
- Inventory tracking dashboard
- Analytics and reporting

#### Backend API
**Framework**: ASP.NET Core 10.0+ Web API
- RESTful API design
- JWT-based authentication
- Swagger/OpenAPI documentation
- CORS configuration for frontend apps

**Architecture**: Clean Architecture (Onion Architecture)
- **Presentation Layer**: API Controllers, DTOs, Filters
- **Application Layer**: Use Cases, Application Services, Interfaces
- **Domain Layer**: Entities, Value Objects, Domain Services, Domain Events
- **Infrastructure Layer**: EF Core, Repositories, External Service Implementations

**Database**: PostgreSQL with Entity Framework Core
- Code-first migrations
- LINQ queries for type safety
- Connection pooling
- Separate Category table with foreign key relationships

**Authentication**: ASP.NET Core Identity + JWT
- Secure password hashing (PBKDF2)
- Role-based authorization (Customer, Admin)
- Refresh token support
- Email confirmation

**Payment Processing**: PayNow (Zimbabwean Payment Gateway)
- Integration with PayNow API
- Support for multiple currencies (USD, ZAR, ZWL)
- Webhook integration for payment status updates
- Transaction logging and reconciliation

**Email Service**: SendGrid or SMTP
- Transactional emails for orders and notifications
- Template management
- Delivery tracking

**Image Storage**: Local file system or cloud storage (AWS S3 / Azure Blob Storage)
- Optimized image delivery
- Multiple image sizes for responsive design
- Secure upload with validation

**Caching**: Redis (optional for production)
- Product catalog caching
- Session storage
- Rate limiting

### VPS Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Load Balancer                            │
│                    (Nginx / HAProxy)                             │
│                  - SSL Termination                               │
│                  - Request routing                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ↓                           ↓
┌──────────────────────────┐   ┌──────────────────────────┐
│   Web Server 1 (Nginx)   │   │   Web Server 2 (Nginx)   │
│   - Next.js Frontend     │   │   - Next.js Frontend     │
│   - Angular Admin        │   │   - Angular Admin        │
│   (Static files)         │   │   (Static files)         │
└──────────────────────────┘   └──────────────────────────┘
                │                           │
                └─────────────┬─────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Application Server                            │
│              ASP.NET Core Web API (Kestrel)                      │
│              - Running on Linux (Ubuntu/Debian)                  │
│              - Systemd service for process management            │
│              - Multiple instances for load balancing             │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ↓                           ↓
┌──────────────────────────┐   ┌──────────────────────────┐
│   PostgreSQL Database    │   │   Redis Cache            │
│   - Primary instance     │   │   - Session storage      │
│   - Automated backups    │   │   - Product cache        │
└──────────────────────────┘   └──────────────────────────┘
```

**VPS Hosting Requirements**:
- **OS**: Ubuntu 22.04 LTS or Debian 12
- **Runtime**: .NET 8.0 Runtime, Node.js 20+ LTS
- **Web Server**: Nginx (reverse proxy)
- **Process Manager**: Systemd for .NET API
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+ (optional)
- **SSL**: Let's Encrypt (Certbot)
- **Monitoring**: Application Insights, Prometheus, or custom logging
- **Backup**: Automated database backups, file system snapshots

**Deployment Process**:
1. Build Next.js frontend (static export or SSR)
2. Build Angular admin panel (production build)
3. Publish ASP.NET Core API (self-contained or framework-dependent)
4. Deploy to VPS via SSH/SFTP or CI/CD pipeline
5. Configure Nginx reverse proxy
6. Set up SSL certificates
7. Configure systemd services
8. Run database migrations
9. Verify health checks

### Clean Architecture Layers Detail

#### 1. Domain Layer (Core)
**Purpose**: Contains enterprise business logic and domain entities

**Components**:
- **Entities**: Product, Category, Order, OrderItem, User, Address, Cart, CartItem, PageContent, InventoryLog
- **Value Objects**: Money, Email, Address, OrderNumber
- **Domain Services**: PricingService, InventoryService
- **Domain Events**: OrderCreatedEvent, ProductOutOfStockEvent, InventoryChangedEvent
- **Interfaces**: No dependencies on external layers

**Example Entity**:
```csharp
public class Product : BaseEntity
{
    public string Name { get; private set; }
    public string Slug { get; private set; }
    public string Description { get; private set; }
    public Guid CategoryId { get; private set; }
    public Category Category { get; private set; }
    public decimal Price { get; private set; }
    public string Currency { get; private set; }
    public int InventoryCount { get; private set; }
    public int LowStockThreshold { get; private set; }
    public bool IsAvailable { get; private set; }
    public string? Sku { get; private set; }
    public List<ProductImage> Images { get; private set; }
    
    public void UpdateInventory(int newCount, string reason, string changedBy)
    {
        var previousCount = InventoryCount;
        InventoryCount = newCount;
        
        if (InventoryCount == 0)
        {
            MarkAsUnavailable();
        }
        
        AddDomainEvent(new InventoryChangedEvent(Id, previousCount, newCount, reason, changedBy));
    }
    
    public void MarkAsUnavailable()
    {
        IsAvailable = false;
    }
}
```

#### 2. Application Layer
**Purpose**: Contains application business logic and use cases

**Components**:
- **Use Cases / Commands**: CreateProductCommand, ProcessOrderCommand, UpdateInventoryCommand
- **Queries**: GetProductsQuery, GetOrdersByUserQuery
- **DTOs**: ProductDto, OrderDto, CreateProductRequest
- **Interfaces**: IProductRepository, IOrderRepository, IPaymentService, IEmailService
- **Validators**: FluentValidation for input validation
- **Mappers**: AutoMapper profiles

**Example Use Case**:
```csharp
public class ProcessOrderCommandHandler : IRequestHandler<ProcessOrderCommand, OrderDto>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IProductRepository _productRepository;
    private readonly IPaymentService _paymentService;
    private readonly IEmailService _emailService;
    
    public async Task<OrderDto> Handle(ProcessOrderCommand request, CancellationToken cancellationToken)
    {
        // Validate inventory
        foreach (var item in request.Items)
        {
            var product = await _productRepository.GetByIdAsync(item.ProductId);
            if (product.InventoryCount < item.Quantity)
            {
                throw new InsufficientInventoryException(product.Name);
            }
        }
        
        // Process payment
        var paymentResult = await _paymentService.ProcessPaymentAsync(request.PaymentDetails);
        if (!paymentResult.Success)
        {
            throw new PaymentFailedException(paymentResult.ErrorMessage);
        }
        
        // Create order
        var order = Order.Create(request.UserId, request.Items, request.ShippingAddress, paymentResult.TransactionId);
        await _orderRepository.AddAsync(order);
        
        // Update inventory
        foreach (var item in request.Items)
        {
            var product = await _productRepository.GetByIdAsync(item.ProductId);
            product.UpdateInventory(product.InventoryCount - item.Quantity, "Order placed", "System");
        }
        
        // Send confirmation email
        await _emailService.SendOrderConfirmationAsync(order);
        
        return _mapper.Map<OrderDto>(order);
    }
}
```

#### 3. Infrastructure Layer
**Purpose**: Implements interfaces defined in Application layer

**Components**:
- **Data Access**: EF Core DbContext, Repositories
- **External Services**: PayNowPaymentService, SendGridEmailService
- **File Storage**: LocalFileStorageService, S3FileStorageService
- **Caching**: RedisCacheService
- **Identity**: ASP.NET Core Identity implementation

**Example Repository**:
```csharp
public class ProductRepository : IProductRepository
{
    private readonly ApplicationDbContext _context;
    
    public async Task<Product> GetByIdAsync(Guid id)
    {
        return await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id);
    }
    
    public async Task<PagedResult<Product>> GetByCategoryAsync(Guid categoryId, int page, int pageSize)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Images)
            .Where(p => p.CategoryId == categoryId && p.IsAvailable);
            
        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
            
        return new PagedResult<Product>(items, total, page, pageSize);
    }
}
```

#### 4. Presentation Layer (API)
**Purpose**: Exposes HTTP endpoints and handles requests

**Components**:
- **Controllers**: ProductsController, OrdersController, AuthController, CategoriesController
- **Filters**: Authorization, Exception handling, Validation
- **Middleware**: Authentication, Logging, CORS
- **API Models**: Request/Response DTOs

**Example Controller**:
```csharp
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IMediator _mediator;
    
    [HttpGet]
    public async Task<ActionResult<PagedResult<ProductDto>>> GetProducts(
        [FromQuery] Guid? categoryId,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = new GetProductsQuery(categoryId, search, page, pageSize);
        var result = await _mediator.Send(query);
        return Ok(result);
    }
    
    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProduct(Guid id)
    {
        var query = new GetProductByIdQuery(id);
        var result = await _mediator.Send(query);
        return result != null ? Ok(result) : NotFound();
    }
    
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductRequest request)
    {
        var command = new CreateProductCommand(request);
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetProduct), new { id = result.Id }, result);
    }
}
```


## Components and Interfaces

### Customer Frontend Components (Next.js)

#### 1. Product Catalog Component
**Purpose**: Display products organized by categories with search and filtering

**Props**:
```typescript
interface ProductCatalogProps {
  categoryId?: string;
  searchQuery?: string;
  page?: number;
  itemsPerPage?: number;
}
```

**Key Features**:
- Grid layout responsive to screen size
- Lazy loading for images
- Pagination or infinite scroll
- Filter by category, price range, availability
- Calls backend API: `GET /api/products`

#### 2. Product Detail Component
**Purpose**: Display comprehensive product information

**Props**:
```typescript
interface ProductDetailProps {
  productId: string;
}
```

**Key Features**:
- Image gallery with zoom
- Price display with currency conversion
- Availability status
- Add to cart functionality
- Related products section
- Calls backend API: `GET /api/products/{id}`

#### 3. Shopping Cart Component
**Purpose**: Display cart contents and allow modifications

**State**:
```typescript
interface CartState {
  items: CartItem[];
  subtotal: number;
  currency: string;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}
```

**Key Features**:
- Real-time price updates
- Quantity adjustment
- Remove items
- Persist to localStorage for guest users
- Sync with backend for authenticated users
- Calls backend API: `GET /api/cart`, `POST /api/cart/items`, `PUT /api/cart/items/{id}`, `DELETE /api/cart/items/{id}`

#### 4. Checkout Component
**Purpose**: Collect shipping and payment information

**Flow**:
1. Shipping address form
2. Contact information
3. Payment details (PayNow integration)
4. Order review
5. Confirmation

**Key Features**:
- Multi-step form with validation
- Address autocomplete
- Secure payment integration with PayNow
- Order summary sidebar
- Error handling and retry logic
- Calls backend API: `POST /api/orders`

#### 5. User Account Component
**Purpose**: Manage user profile and view order history

**Sections**:
- Profile information
- Saved addresses
- Order history with status tracking
- Password change

**API Calls**:
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `GET /api/orders/my-orders`
- `POST /api/auth/change-password`

#### 6. Header/Navigation Component
**Purpose**: Site-wide navigation and branding

**Key Features**:
- Logo and company name
- Main navigation menu
- Search bar
- Cart icon with item count
- User account menu
- Currency selector
- Mobile-responsive hamburger menu

#### 7. Footer Component
**Purpose**: Site-wide footer with links and contact info

**Content**:
- Company information
- Quick links (About, Services, Contact)
- Contact details
- Social media links
- Copyright notice

### Admin Panel Components (Angular)

#### 1. Product Management Module
**Purpose**: CRUD operations for products

**Components**:
- `ProductListComponent`: Display products with search and filters
- `ProductFormComponent`: Create/edit product form
- `ProductDetailComponent`: View product details

**Features**:
- Product list with search and filters
- Create/edit product form with:
  - Rich text editor for descriptions
  - Image upload with preview
  - Category dropdown (populated from Category table)
  - Price and inventory fields
  - Availability toggle
- Bulk operations (delete, update status)
- Import/export functionality

**API Calls**:
- `GET /api/products`
- `GET /api/products/{id}`
- `POST /api/products`
- `PUT /api/products/{id}`
- `DELETE /api/products/{id}`
- `GET /api/categories` (for dropdown)

#### 2. Category Management Module
**Purpose**: CRUD operations for product categories

**Components**:
- `CategoryListComponent`: Display all categories
- `CategoryFormComponent`: Create/edit category

**Features**:
- List all categories
- Create new category
- Edit existing category
- Delete category (with validation that no products reference it)
- Reorder categories

**API Calls**:
- `GET /api/categories`
- `GET /api/categories/{id}`
- `POST /api/categories`
- `PUT /api/categories/{id}`
- `DELETE /api/categories/{id}`

#### 3. Order Management Module
**Purpose**: View and manage customer orders

**Components**:
- `OrderListComponent`: Display orders with filters
- `OrderDetailComponent`: View order details
- `OrderStatusComponent`: Update order status

**Features**:
- Order list with filters (date, status, customer)
- Order detail view showing:
  - Customer information
  - Product list
  - Payment status
  - Shipping address
  - Order timeline
- Status update workflow
- Export to CSV
- Sales analytics dashboard

**API Calls**:
- `GET /api/orders`
- `GET /api/orders/{id}`
- `PUT /api/orders/{id}/status`
- `GET /api/orders/analytics`
- `GET /api/orders/export`

#### 4. Content Management Module
**Purpose**: Edit website content pages

**Components**:
- `ContentListComponent`: List all pages
- `ContentEditorComponent`: Edit page content

**Features**:
- Page selector (About, Services, Contact)
- Rich text editor (TinyMCE or CKEditor)
- Image management
- Preview mode
- Publish/draft workflow
- Version history

**API Calls**:
- `GET /api/content`
- `GET /api/content/{slug}`
- `PUT /api/content/{slug}`
- `POST /api/content/images`

#### 5. Inventory Management Module
**Purpose**: Track and adjust product inventory

**Components**:
- `InventoryListComponent`: Display inventory levels
- `InventoryAdjustmentComponent`: Manual adjustment form
- `InventoryHistoryComponent`: View inventory changes

**Features**:
- Inventory levels by product
- Low stock alerts
- Manual adjustment form with notes
- Inventory history log
- Automatic updates on order completion

**API Calls**:
- `GET /api/inventory`
- `POST /api/inventory/adjust`
- `GET /api/inventory/history/{productId}`
- `GET /api/inventory/low-stock`

#### 6. Admin Dashboard Module
**Purpose**: Overview of key metrics and recent activity

**Components**:
- `DashboardComponent`: Main dashboard
- `SalesWidgetComponent`: Sales summary
- `RecentOrdersWidgetComponent`: Recent orders
- `LowStockWidgetComponent`: Low stock alerts

**Widgets**:
- Sales summary (today, week, month)
- Recent orders
- Low stock alerts
- Popular products
- Quick actions

**API Calls**:
- `GET /api/dashboard/summary`
- `GET /api/dashboard/recent-orders`
- `GET /api/dashboard/low-stock`

### Backend API Interfaces

#### Product API

```csharp
// Get products with filtering and pagination
GET /api/products
Query params: {
  categoryId?: Guid;
  search?: string;
  page?: int;
  pageSize?: int;
  inStock?: bool;
}
Response: PagedResult<ProductDto>

// Get single product
GET /api/products/{id}
Response: ProductDto

// Create product (admin only)
POST /api/products
Body: CreateProductRequest
Response: ProductDto

// Update product (admin only)
PUT /api/products/{id}
Body: UpdateProductRequest
Response: ProductDto

// Delete product (admin only)
DELETE /api/products/{id}
Response: 204 No Content
```

#### Category API

```csharp
// Get all categories
GET /api/categories
Response: List<CategoryDto>

// Get single category
GET /api/categories/{id}
Response: CategoryDto

// Create category (admin only)
POST /api/categories
Body: CreateCategoryRequest
Response: CategoryDto

// Update category (admin only)
PUT /api/categories/{id}
Body: UpdateCategoryRequest
Response: CategoryDto

// Delete category (admin only)
DELETE /api/categories/{id}
Response: 204 No Content
```

#### Cart API

```csharp
// Get user's cart
GET /api/cart
Response: CartDto

// Add item to cart
POST /api/cart/items
Body: { productId: Guid, quantity: int }
Response: CartDto

// Update cart item quantity
PUT /api/cart/items/{productId}
Body: { quantity: int }
Response: CartDto

// Remove item from cart
DELETE /api/cart/items/{productId}
Response: CartDto

// Clear cart
DELETE /api/cart
Response: 204 No Content
```

#### Order API

```csharp
// Create order (checkout)
POST /api/orders
Body: {
  shippingAddress: AddressDto;
  contactInfo: ContactInfoDto;
  paymentDetails: PaymentDetailsDto;
  currency: string;
}
Response: {
  order: OrderDto;
  paymentReference: string;
}

// Get user's orders
GET /api/orders/my-orders
Response: List<OrderDto>

// Get single order
GET /api/orders/{id}
Response: OrderDto

// Update order status (admin only)
PUT /api/orders/{id}/status
Body: { status: OrderStatus }
Response: OrderDto

// Get all orders (admin only)
GET /api/orders
Query params: {
  status?: OrderStatus;
  startDate?: DateTime;
  endDate?: DateTime;
  page?: int;
  pageSize?: int;
}
Response: PagedResult<OrderDto>

// Get order analytics (admin only)
GET /api/orders/analytics
Query params: {
  startDate?: DateTime;
  endDate?: DateTime;
}
Response: OrderAnalyticsDto

// Export orders (admin only)
GET /api/orders/export
Query params: {
  startDate?: DateTime;
  endDate?: DateTime;
  format?: string; // csv, excel
}
Response: File
```

#### Auth API

```csharp
// Register new user
POST /api/auth/register
Body: {
  email: string;
  password: string;
  name: string;
}
Response: { user: UserDto; token: string; refreshToken: string }

// Login
POST /api/auth/login
Body: { email: string; password: string }
Response: { user: UserDto; token: string; refreshToken: string }

// Refresh token
POST /api/auth/refresh
Body: { refreshToken: string }
Response: { token: string; refreshToken: string }

// Logout
POST /api/auth/logout
Response: 204 No Content

// Request password reset
POST /api/auth/reset-password
Body: { email: string }
Response: { success: bool }

// Confirm password reset
POST /api/auth/reset-password/confirm
Body: { token: string; newPassword: string }
Response: { success: bool }

// Change password
POST /api/auth/change-password
Body: { currentPassword: string; newPassword: string }
Response: { success: bool }
```

#### Content API

```csharp
// Get all pages
GET /api/content
Response: List<PageContentDto>

// Get page content
GET /api/content/{slug}
Response: PageContentDto

// Update page content (admin only)
PUT /api/content/{slug}
Body: { content: string; metadata: PageMetadataDto }
Response: PageContentDto

// Upload image (admin only)
POST /api/content/images
Body: FormData (multipart)
Response: { url: string; fileName: string }
```

#### Inventory API

```csharp
// Get inventory levels
GET /api/inventory
Query params: {
  lowStockOnly?: bool;
  page?: int;
  pageSize?: int;
}
Response: PagedResult<InventoryDto>

// Adjust inventory (admin only)
POST /api/inventory/adjust
Body: {
  productId: Guid;
  newCount: int;
  reason: string;
}
Response: InventoryDto

// Get inventory history
GET /api/inventory/history/{productId}
Response: List<InventoryLogDto>

// Get low stock alerts
GET /api/inventory/low-stock
Response: List<ProductDto>
```


## Data Models

### Core Entities

#### User
```csharp
public class User : BaseEntity
{
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public string Name { get; set; }
    public UserRole Role { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public ICollection<Address> Addresses { get; set; }
    public ICollection<Order> Orders { get; set; }
    public Cart Cart { get; set; }
}

public enum UserRole
{
    Customer,
    Admin
}
```

#### Category
```csharp
public class Category : BaseEntity
{
    public string Name { get; set; }
    public string Slug { get; set; }
    public string Description { get; set; }
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public ICollection<Product> Products { get; set; }
}
```

#### Product
```csharp
public class Product : BaseEntity
{
    public string Name { get; set; }
    public string Slug { get; set; }
    public string Description { get; set; }
    public Guid CategoryId { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } // Base currency (USD)
    public int InventoryCount { get; set; }
    public int LowStockThreshold { get; set; }
    public bool IsAvailable { get; set; }
    public string? Sku { get; set; }
    public Dictionary<string, string>? Specifications { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public Category Category { get; set; }
    public ICollection<ProductImage> Images { get; set; }
    public ICollection<OrderItem> OrderItems { get; set; }
    public ICollection<CartItem> CartItems { get; set; }
    public ICollection<InventoryLog> InventoryLogs { get; set; }
}
```

#### ProductImage
```csharp
public class ProductImage : BaseEntity
{
    public Guid ProductId { get; set; }
    public string Url { get; set; }
    public string AltText { get; set; }
    public int Order { get; set; }
    
    // Navigation properties
    public Product Product { get; set; }
}
```

#### Cart
```csharp
public class Cart : BaseEntity
{
    public Guid? UserId { get; set; }
    public string? SessionId { get; set; } // For guest carts
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public User? User { get; set; }
    public ICollection<CartItem> Items { get; set; }
}
```

#### CartItem
```csharp
public class CartItem : BaseEntity
{
    public Guid CartId { get; set; }
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal PriceAtAdd { get; set; } // Snapshot of price when added
    
    // Navigation properties
    public Cart Cart { get; set; }
    public Product Product { get; set; }
}
```

#### Order
```csharp
public class Order : BaseEntity
{
    public string OrderNumber { get; set; } // Human-readable order number
    public Guid? UserId { get; set; }
    public OrderStatus Status { get; set; }
    
    // Customer info
    public string CustomerEmail { get; set; }
    public string CustomerName { get; set; }
    public Address ShippingAddress { get; set; } // Owned entity
    
    // Order details
    public decimal Subtotal { get; set; }
    public decimal Tax { get; set; }
    public decimal ShippingCost { get; set; }
    public decimal Total { get; set; }
    public string Currency { get; set; }
    public decimal ExchangeRate { get; set; } // Rate used at time of order
    
    // Payment
    public PaymentStatus PaymentStatus { get; set; }
    public string PaymentReference { get; set; } // PayNow reference
    public string PaymentMethod { get; set; }
    
    // Tracking
    public string? TrackingNumber { get; set; }
    public string? Notes { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public User? User { get; set; }
    public ICollection<OrderItem> Items { get; set; }
}

public enum OrderStatus
{
    Pending,
    Processing,
    Shipped,
    Delivered,
    Cancelled
}

public enum PaymentStatus
{
    Pending,
    Completed,
    Failed,
    Refunded
}
```

#### OrderItem
```csharp
public class OrderItem : BaseEntity
{
    public Guid OrderId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } // Snapshot
    public string ProductImage { get; set; } // Snapshot
    public int Quantity { get; set; }
    public decimal PricePerUnit { get; set; }
    public decimal Subtotal { get; set; }
    
    // Navigation properties
    public Order Order { get; set; }
    public Product Product { get; set; }
}
```

#### Address
```csharp
public class Address : BaseEntity
{
    public Guid? UserId { get; set; }
    public string Name { get; set; }
    public string AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string City { get; set; }
    public string State { get; set; }
    public string PostalCode { get; set; }
    public string Country { get; set; }
    public string Phone { get; set; }
    public bool IsDefault { get; set; }
    
    // Navigation properties
    public User? User { get; set; }
}
```

#### PageContent
```csharp
public class PageContent : BaseEntity
{
    public string Slug { get; set; }
    public string Title { get; set; }
    public string Content { get; set; } // HTML or markdown
    public PageMetadata Metadata { get; set; } // Owned entity
    public DateTime? PublishedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public ICollection<ContentVersion> Versions { get; set; }
}

public class PageMetadata
{
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? OgImage { get; set; }
}
```

#### ContentVersion
```csharp
public class ContentVersion : BaseEntity
{
    public Guid PageContentId { get; set; }
    public string Content { get; set; }
    public string CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Navigation properties
    public PageContent PageContent { get; set; }
}
```

#### InventoryLog
```csharp
public class InventoryLog : BaseEntity
{
    public Guid ProductId { get; set; }
    public int PreviousCount { get; set; }
    public int NewCount { get; set; }
    public int ChangeAmount { get; set; }
    public string Reason { get; set; }
    public string ChangedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Navigation properties
    public Product Product { get; set; }
}
```

### Entity Framework Core Configuration

```csharp
public class ApplicationDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductImage> ProductImages { get; set; }
    public DbSet<Cart> Carts { get; set; }
    public DbSet<CartItem> CartItems { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<Address> Addresses { get; set; }
    public DbSet<PageContent> PageContents { get; set; }
    public DbSet<ContentVersion> ContentVersions { get; set; }
    public DbSet<InventoryLog> InventoryLogs { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Category configuration
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(200);
        });
        
        // Product configuration
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => e.CategoryId);
            entity.HasIndex(e => e.IsAvailable);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Price).HasPrecision(18, 2);
            entity.Property(e => e.Currency).HasMaxLength(3);
            
            // Foreign key to Category
            entity.HasOne(e => e.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
            
            // Specifications as JSON
            entity.Property(e => e.Specifications)
                .HasColumnType("jsonb");
        });
        
        // ProductImage configuration
        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ProductId);
            
            entity.HasOne(e => e.Product)
                .WithMany(p => p.Images)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        // Cart configuration
        modelBuilder.Entity<Cart>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.SessionId);
            
            entity.HasOne(e => e.User)
                .WithOne(u => u.Cart)
                .HasForeignKey<Cart>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        // CartItem configuration
        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.CartId, e.ProductId }).IsUnique();
            entity.Property(e => e.PriceAtAdd).HasPrecision(18, 2);
            
            entity.HasOne(e => e.Cart)
                .WithMany(c => c.Items)
                .HasForeignKey(e => e.CartId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Product)
                .WithMany(p => p.CartItems)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Order configuration
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.OrderNumber).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
            
            entity.Property(e => e.Subtotal).HasPrecision(18, 2);
            entity.Property(e => e.Tax).HasPrecision(18, 2);
            entity.Property(e => e.ShippingCost).HasPrecision(18, 2);
            entity.Property(e => e.Total).HasPrecision(18, 2);
            entity.Property(e => e.ExchangeRate).HasPrecision(18, 6);
            
            // Owned entity for ShippingAddress
            entity.OwnsOne(e => e.ShippingAddress);
            
            entity.HasOne(e => e.User)
                .WithMany(u => u.Orders)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
        
        // OrderItem configuration
        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.OrderId);
            entity.Property(e => e.PricePerUnit).HasPrecision(18, 2);
            entity.Property(e => e.Subtotal).HasPrecision(18, 2);
            
            entity.HasOne(e => e.Order)
                .WithMany(o => o.Items)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Product)
                .WithMany(p => p.OrderItems)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Address configuration
        modelBuilder.Entity<Address>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            
            entity.HasOne(e => e.User)
                .WithMany(u => u.Addresses)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        // PageContent configuration
        modelBuilder.Entity<PageContent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
            
            // Owned entity for Metadata
            entity.OwnsOne(e => e.Metadata);
        });
        
        // ContentVersion configuration
        modelBuilder.Entity<ContentVersion>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PageContentId);
            entity.HasIndex(e => e.CreatedAt);
            
            entity.HasOne(e => e.PageContent)
                .WithMany(p => p.Versions)
                .HasForeignKey(e => e.PageContentId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        // InventoryLog configuration
        modelBuilder.Entity<InventoryLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ProductId);
            entity.HasIndex(e => e.CreatedAt);
            
            entity.HasOne(e => e.Product)
                .WithMany(p => p.InventoryLogs)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
```

### Supporting Services

#### Currency Conversion Service
```csharp
public interface ICurrencyService
{
    Task<ExchangeRates> GetExchangeRatesAsync();
    decimal Convert(decimal amount, string fromCurrency, string toCurrency);
    Task<string> DetectCurrencyAsync(string ipAddress);
}

public class ExchangeRates
{
    public string BaseCurrency { get; set; } // USD
    public Dictionary<string, decimal> Rates { get; set; }
    public DateTime LastUpdated { get; set; }
}
```

#### Email Service
```csharp
public interface IEmailService
{
    Task SendOrderConfirmationAsync(Order order);
    Task SendShippingNotificationAsync(Order order, string trackingNumber);
    Task SendDeliveryConfirmationAsync(Order order);
    Task SendContactFormEmailAsync(ContactForm form);
    Task SendPasswordResetEmailAsync(string email, string resetToken);
}
```

#### Payment Service (PayNow Integration)
```csharp
public interface IPaymentService
{
    Task<PaymentInitiationResult> InitiatePaymentAsync(decimal amount, string currency, string reference);
    Task<PaymentResult> ConfirmPaymentAsync(string paymentReference);
    Task<WebhookResult> HandleWebhookAsync(PayNowWebhookEvent webhookEvent);
    Task<RefundResult> RefundPaymentAsync(string paymentReference, decimal? amount = null);
}

public class PaymentInitiationResult
{
    public bool Success { get; set; }
    public string PaymentReference { get; set; }
    public string PaymentUrl { get; set; } // Redirect URL for customer
    public string ErrorMessage { get; set; }
}

public class PaymentResult
{
    public bool Success { get; set; }
    public string TransactionId { get; set; }
    public PaymentStatus Status { get; set; }
    public string ErrorMessage { get; set; }
}
```

#### File Storage Service
```csharp
public interface IFileStorageService
{
    Task<FileUploadResult> UploadAsync(Stream fileStream, string fileName, string folder);
    Task DeleteAsync(string filePath);
    Task<string> GetUrlAsync(string filePath);
}

public class FileUploadResult
{
    public string Url { get; set; }
    public string FilePath { get; set; }
    public long FileSize { get; set; }
}
```


## Security Considerations

### Authentication & Authorization

1. **Password Security**
   - Hash passwords using ASP.NET Core Identity (PBKDF2 with HMACSHA256)
   - Enforce minimum password requirements (8+ characters, mix of types)
   - Implement rate limiting on login attempts (5 attempts per 15 minutes)
   - Use secure JWT tokens with httpOnly cookies for web clients

2. **JWT Token Management**
   - Short-lived access tokens (15 minutes)
   - Long-lived refresh tokens (7 days) stored securely
   - Token rotation on refresh
   - Revocation support for logout

3. **Role-Based Access Control (RBAC)**
   - Separate Customer and Admin roles
   - Authorize attribute on admin-only endpoints
   - Policy-based authorization for fine-grained control

4. **Session Management**
   - 30-minute inactivity timeout for automatic logout
   - Secure token storage (httpOnly, secure, SameSite cookies)
   - CSRF protection on state-changing operations

### Data Protection

1. **HTTPS Everywhere**
   - Enforce HTTPS on all endpoints
   - HSTS headers to prevent downgrade attacks
   - Valid SSL certificate (Let's Encrypt on VPS)

2. **Payment Security**
   - Never store complete credit card numbers
   - Use PayNow secure payment flow
   - Tokenize payment methods
   - Validate payment webhooks with signature verification

3. **Input Validation**
   - Validate all user inputs on both client and server
   - Use FluentValidation for server-side validation
   - Sanitize HTML content to prevent XSS
   - Parameterized queries via EF Core (prevents SQL injection)

4. **Sensitive Data**
   - Hash passwords before storage (ASP.NET Core Identity)
   - Encrypt sensitive configuration (Azure Key Vault or environment variables)
   - Mask payment information in admin views
   - Implement data retention policies

### API Security

1. **Rate Limiting**
   - Implement rate limits on all API endpoints
   - Stricter limits on authentication endpoints (5 requests per 15 minutes)
   - Use AspNetCoreRateLimit middleware

2. **CORS Configuration**
   - Restrict CORS to known frontend domains
   - Validate origin headers
   - Configure allowed methods and headers

3. **Request Validation**
   - Validate request body schemas with FluentValidation
   - Limit request payload sizes (10MB max)
   - Timeout long-running requests (30 seconds)

4. **API Versioning**
   - Version API endpoints (e.g., /api/v1/products)
   - Maintain backward compatibility
   - Deprecation notices for old versions

### Infrastructure Security (VPS)

1. **Environment Variables**
   - Store secrets in environment variables or configuration files
   - Never commit secrets to version control
   - Use different credentials for dev/staging/production

2. **Database Security**
   - Use connection pooling
   - Restrict database access to application server only (firewall rules)
   - Regular automated backups with encryption
   - Principle of least privilege for database users

3. **Server Hardening**
   - Keep OS and packages updated
   - Configure firewall (UFW) to allow only necessary ports (80, 443, 22)
   - Disable root SSH login
   - Use SSH keys instead of passwords
   - Install fail2ban for brute force protection

4. **Monitoring & Logging**
   - Log security events (failed logins, permission denials)
   - Monitor for suspicious activity
   - Set up alerts for anomalies
   - Sanitize logs to avoid leaking sensitive data
   - Use Serilog for structured logging

## Performance Optimization

### Frontend Performance (Next.js)

1. **Code Splitting**
   - Lazy load components not needed for initial render
   - Dynamic imports for heavy libraries
   - Route-based code splitting (automatic with Next.js)

2. **Image Optimization**
   - Use Next.js Image component for automatic optimization
   - Serve WebP/AVIF formats with fallbacks
   - Lazy load images below the fold
   - Implement blur placeholders

3. **Caching Strategy**
   - Cache static assets with long TTL
   - Use stale-while-revalidate for product data
   - Service worker for offline support (optional)

4. **Bundle Optimization**
   - Tree shaking to remove unused code
   - Minimize JavaScript bundle size
   - Use React Server Components where possible
   - Preload critical resources

### Admin Panel Performance (Angular)

1. **Lazy Loading**
   - Lazy load feature modules
   - Preload strategy for frequently accessed modules

2. **Change Detection**
   - Use OnPush change detection strategy
   - Avoid unnecessary re-renders
   - Use trackBy in ngFor loops

3. **Bundle Optimization**
   - AOT compilation for production
   - Tree shaking and dead code elimination
   - Differential loading for modern browsers

### Backend Performance (ASP.NET Core)

1. **Database Optimization**
   - Index frequently queried fields (CategoryId, Status, CreatedAt)
   - Use database connection pooling
   - Implement pagination for large result sets
   - Optimize N+1 queries with Include/ThenInclude
   - Use AsNoTracking for read-only queries

2. **Caching Layer**
   - Cache product catalog in Redis (5-minute TTL)
   - Cache exchange rates (24-hour TTL)
   - Cache page content (invalidate on update)
   - Use IMemoryCache for in-process caching
   - Use IDistributedCache (Redis) for multi-instance scenarios

3. **API Optimization**
   - Implement response compression (gzip/brotli)
   - Use efficient serialization (System.Text.Json)
   - Batch database operations where possible
   - Implement request deduplication
   - Use async/await throughout

4. **Background Jobs**
   - Use Hangfire or Quartz.NET for background tasks
   - Process emails asynchronously
   - Update exchange rates in background
   - Generate reports asynchronously

### VPS Performance Optimization

1. **Nginx Configuration**
   - Enable gzip compression
   - Configure caching headers
   - Use HTTP/2
   - Optimize buffer sizes

2. **Kestrel Configuration**
   - Configure connection limits
   - Set request timeout
   - Enable response compression

3. **Database Tuning**
   - Optimize PostgreSQL configuration (shared_buffers, work_mem)
   - Regular VACUUM and ANALYZE
   - Monitor slow queries

4. **Resource Monitoring**
   - Monitor CPU, memory, disk usage
   - Set up alerts for resource exhaustion
   - Use APM tools (Application Insights, Prometheus)

### Monitoring & Metrics

1. **Performance Monitoring**
   - Track API response times
   - Monitor database query performance
   - Track Core Web Vitals (LCP, FID, CLS) for frontend
   - Set up alerts for degradation

2. **Error Tracking**
   - Implement error logging (Serilog + Seq/ELK)
   - Track error rates and types
   - Monitor payment failures
   - Alert on critical errors

3. **Analytics**
   - Track user behavior and conversion funnels
   - Monitor cart abandonment rates
   - Track product views and purchases
   - A/B testing capability

## Error Handling

### Error Handling Strategy

The system implements a comprehensive error handling strategy with clear error boundaries, user-friendly messages, and detailed logging for debugging.

### Frontend Error Handling (Next.js)

1. **React Error Boundaries**
   - Wrap major sections in error boundaries
   - Display fallback UI when component errors occur
   - Log errors to monitoring service
   - Provide recovery actions (reload, go back)

2. **API Error Handling**
   - Catch and handle API errors gracefully
   - Display user-friendly error messages
   - Retry logic for transient failures
   - Fallback to cached data when appropriate

3. **Form Validation Errors**
   - Display inline validation errors
   - Highlight invalid fields
   - Provide clear guidance on how to fix errors
   - Prevent submission until validation passes

4. **Network Errors**
   - Detect offline state
   - Queue actions for retry when connection restored
   - Display offline indicator
   - Provide manual retry option

### Admin Panel Error Handling (Angular)

1. **Global Error Handler**
   - Implement custom ErrorHandler
   - Log errors to backend
   - Display user-friendly error messages
   - Provide recovery options

2. **HTTP Interceptor**
   - Intercept HTTP errors
   - Handle 401 (redirect to login)
   - Handle 403 (show permission denied)
   - Handle 500 (show generic error)
   - Retry transient failures

3. **Form Validation**
   - Reactive forms with validators
   - Display validation errors
   - Disable submit until valid

### Backend Error Handling (ASP.NET Core)

1. **Global Exception Handler**
   ```csharp
   public class GlobalExceptionHandler : IExceptionHandler
   {
       private readonly ILogger<GlobalExceptionHandler> _logger;
       
       public async ValueTask<bool> TryHandleAsync(
           HttpContext httpContext,
           Exception exception,
           CancellationToken cancellationToken)
       {
           _logger.LogError(exception, "An unhandled exception occurred");
           
           var problemDetails = exception switch
           {
               ValidationException validationEx => new ValidationProblemDetails
               {
                   Status = StatusCodes.Status400BadRequest,
                   Title = "Validation Error",
                   Detail = validationEx.Message
               },
               NotFoundException notFoundEx => new ProblemDetails
               {
                   Status = StatusCodes.Status404NotFound,
                   Title = "Not Found",
                   Detail = notFoundEx.Message
               },
               UnauthorizedException => new ProblemDetails
               {
                   Status = StatusCodes.Status401Unauthorized,
                   Title = "Unauthorized"
               },
               ForbiddenException => new ProblemDetails
               {
                   Status = StatusCodes.Status403Forbidden,
                   Title = "Forbidden"
               },
               _ => new ProblemDetails
               {
                   Status = StatusCodes.Status500InternalServerError,
                   Title = "Internal Server Error",
                   Detail = "An unexpected error occurred"
               }
           };
           
           httpContext.Response.StatusCode = problemDetails.Status ?? 500;
           await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
           
           return true;
       }
   }
   ```

2. **Error Response Format**
   ```csharp
   public class ErrorResponse
   {
       public string Type { get; set; }
       public string Title { get; set; }
       public int Status { get; set; }
       public string Detail { get; set; }
       public string TraceId { get; set; }
       public Dictionary<string, string[]>? Errors { get; set; }
   }
   ```

3. **Custom Exceptions**
   - ValidationException (400)
   - NotFoundException (404)
   - UnauthorizedException (401)
   - ForbiddenException (403)
   - ConflictException (409)
   - PaymentFailedException (custom handling)
   - InsufficientInventoryException (custom handling)

### Specific Error Scenarios

#### Payment Processing Errors

```csharp
public async Task<OrderDto> ProcessOrderAsync(ProcessOrderCommand command)
{
    try
    {
        // Initiate payment with PayNow
        var paymentResult = await _paymentService.InitiatePaymentAsync(
            command.Total, 
            command.Currency, 
            command.OrderReference);
            
        if (!paymentResult.Success)
        {
            throw new PaymentFailedException(paymentResult.ErrorMessage);
        }
        
        // Create order
        var order = await CreateOrderAsync(command, paymentResult.PaymentReference);
        
        return _mapper.Map<OrderDto>(order);
    }
    catch (PaymentFailedException ex)
    {
        _logger.LogWarning(ex, "Payment failed for order {OrderReference}", command.OrderReference);
        throw; // Re-throw to be handled by global handler
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Unexpected error processing order {OrderReference}", command.OrderReference);
        throw;
    }
}
```

#### Inventory Errors

```csharp
public async Task ValidateInventoryAsync(List<OrderItemDto> items)
{
    var unavailableItems = new List<string>();
    
    foreach (var item in items)
    {
        var product = await _productRepository.GetByIdAsync(item.ProductId);
        
        if (product == null)
        {
            throw new NotFoundException($"Product {item.ProductId} not found");
        }
        
        if (product.InventoryCount < item.Quantity)
        {
            unavailableItems.Add(product.Name);
        }
    }
    
    if (unavailableItems.Any())
    {
        throw new InsufficientInventoryException(
            $"Insufficient inventory for: {string.Join(", ", unavailableItems)}");
    }
}
```

#### Email Delivery Errors

```csharp
public async Task SendOrderConfirmationAsync(Order order)
{
    try
    {
        await _emailService.SendOrderConfirmationAsync(order);
    }
    catch (Exception ex)
    {
        // Log error but don't fail the order
        _logger.LogError(ex, "Failed to send order confirmation for order {OrderId}", order.Id);
        
        // Queue for retry
        await _backgroundJobService.EnqueueAsync<SendEmailJob>(
            job => job.SendOrderConfirmationAsync(order.Id));
    }
}
```

### Error Logging and Monitoring

1. **Structured Logging with Serilog**
   ```csharp
   Log.Error(ex, "Payment processing failed for order {OrderId} with amount {Amount} {Currency}",
       orderId, amount, currency);
   ```

2. **Log Levels**
   - Trace: Detailed diagnostic information
   - Debug: Internal system events
   - Information: General informational messages
   - Warning: Abnormal or unexpected events
   - Error: Errors and exceptions
   - Critical: Critical failures requiring immediate attention

3. **Monitoring Integration**
   - Application Insights for Azure deployments
   - Seq or ELK stack for VPS deployments
   - Set up alerts for error rate thresholds
   - Track error trends over time


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Category Filtering Completeness

For any product catalog and any category selection, filtering by that category should return all and only products that belong to that category (via CategoryId foreign key).

**Validates: Requirements 1.2**

### Property 2: Product Display Completeness

For any product, the rendered product view should contain the product name, description, at least one image, price, and availability status.

**Validates: Requirements 1.3**

### Property 3: Cart Addition Persistence

For any product and any cart state, adding a product to the cart should result in that product being present in the cart with the specified quantity.

**Validates: Requirements 2.1**

### Property 4: Cart Item Count Accuracy

For any cart state, the displayed item count should equal the sum of quantities of all items in the cart.

**Validates: Requirements 2.2**

### Property 5: Cart Total Calculation

For any cart state, the total price should equal the sum of (quantity × price) for all items in the cart.

**Validates: Requirements 2.3, 2.4**

### Property 6: Cart Item Removal

For any cart and any product in that cart, removing the product should result in the cart no longer containing that product and the total being recalculated correctly.

**Validates: Requirements 2.5**

### Property 7: Checkout Validation

For any checkout attempt with missing required fields (shipping address, contact information, or payment details), the system should reject the submission and not process payment.

**Validates: Requirements 3.2**

### Property 8: Order Creation on Payment Success

For any successful payment transaction, an order record should be created with all cart items, customer information, and payment details.

**Validates: Requirements 3.4**

### Property 9: Cart Preservation on Payment Failure

For any payment failure, the cart contents should remain unchanged and available for retry.

**Validates: Requirements 3.5**

### Property 10: Email Notification Triggers

For any order state transition (created, shipped, delivered), the appropriate notification email should be triggered to the customer.

**Validates: Requirements 3.6, 7.4, 13.1, 13.2, 13.3**

### Property 11: Registration Validation

For any registration attempt, invalid email formats should be rejected and passwords not meeting strength requirements (minimum 8 characters) should be rejected.

**Validates: Requirements 4.2**

### Property 12: Authentication Round Trip

For any valid user credentials, login should succeed and return the user's session. For any invalid credentials, login should fail.

**Validates: Requirements 4.3**

### Property 13: Order History Retrieval

For any authenticated user, retrieving order history should return all and only orders belonging to that user.

**Validates: Requirements 4.4**

### Property 14: Profile Update Persistence

For any user profile update with valid data, the changes should be persisted and retrievable on subsequent queries.

**Validates: Requirements 4.5**

### Property 15: Product CRUD Operations

For any valid product data, creating a product should make it available in the catalog. For any existing product and valid updates, updating should persist the changes. For any product, deleting should remove it from the catalog.

**Validates: Requirements 6.2, 6.3, 6.6**

### Property 16: Product Availability Toggle

For any product, toggling the availability status should update the product's IsAvailable field and reflect in customer-facing queries.

**Validates: Requirements 6.4**

### Property 17: Product Changes Propagation

For any product modification by an admin, the changes should be visible in customer-facing product queries.

**Validates: Requirements 6.5**

### Property 18: Order Filtering Accuracy

For any order filter criteria (date range, status, customer), the returned orders should match all specified criteria and only those criteria.

**Validates: Requirements 7.2**

### Property 19: Order Status Updates

For any order and any valid status transition, updating the order status should persist the new status.

**Validates: Requirements 7.3**

### Property 20: Order Analytics Calculation

For any date range and set of orders, the calculated totals should equal the sum of all order totals within that date range.

**Validates: Requirements 7.5**

### Property 21: Order Export Completeness

For any set of orders, exporting to CSV should produce valid CSV format containing all order data fields.

**Validates: Requirements 7.6**

### Property 22: Image Upload Round Trip

For any valid image file, uploading should succeed and the image should be retrievable via the returned URL.

**Validates: Requirements 8.2**

### Property 23: Content Publishing Visibility

For any content change that is published, the updated content should be visible in customer-facing page queries.

**Validates: Requirements 8.3**

### Property 24: Content Version History

For any content update, a new version record should be created with the previous content, timestamp, and author.

**Validates: Requirements 8.4**

### Property 25: Inventory Decrement on Order

For any completed order, the inventory count for each ordered product should decrease by the ordered quantity.

**Validates: Requirements 9.2**

### Property 26: Out of Stock Marking

For any product with inventory count of zero, the product should be automatically marked as unavailable (IsAvailable = false).

**Validates: Requirements 9.3**

### Property 27: Low Stock Alerts

For any product with inventory count below its configured threshold, a low stock alert should be generated.

**Validates: Requirements 9.4**

### Property 28: Inventory Adjustment Logging

For any manual inventory adjustment, a log entry should be created recording the previous count, new count, change amount, reason, and admin user.

**Validates: Requirements 9.5**

### Property 29: HTML Semantic Structure

For any rendered page, the HTML should have a proper heading hierarchy (single h1, nested h2-h6 in order).

**Validates: Requirements 10.1**

### Property 30: Page Metadata Completeness

For any page, the HTML should include meta title, meta description, Open Graph tags, and (for product pages) structured data markup.

**Validates: Requirements 10.2, 10.4, 10.5**

### Property 31: Sitemap Completeness

The generated sitemap.xml should contain entries for all public pages (home, about, services, contact, all product pages, all category pages).

**Validates: Requirements 10.3**

### Property 32: Password Hashing

For any password storage operation, the stored value should be a hashed version (not plaintext) using PBKDF2 or similar algorithm.

**Validates: Requirements 12.2**

### Property 33: Credit Card Non-Storage

For any payment processing, the database should never contain complete credit card numbers (only tokenized references or payment gateway references).

**Validates: Requirements 12.3**

### Property 34: Admin Access Control

For any admin-only endpoint, requests from non-admin users should be rejected with appropriate authorization error.

**Validates: Requirements 12.4**

### Property 35: Email Content Completeness

For any order-related email, the email body should contain order details (order number, items, total) and customer support contact information.

**Validates: Requirements 13.4**

### Property 36: Contact Form Submission

For any valid contact form submission, an email should be sent to the support address containing the form data.

**Validates: Requirements 14.2**

### Property 37: Contact Form Confirmation

For any successful contact form submission, a confirmation message should be displayed to the user.

**Validates: Requirements 14.3**

### Property 38: Contact Form Validation

For any contact form submission with invalid email format, the submission should be rejected.

**Validates: Requirements 14.4**

### Property 39: Footer Contact Information

For any page, the rendered footer should contain the company phone number and email address.

**Validates: Requirements 14.5**

### Property 40: Form Error Preservation

For any form submission failure, the form should retain the user's input data for correction and resubmission.

**Validates: Requirements 14.6**

### Property 41: Currency Selection

For any currency selection by the user, all displayed prices should be converted to the selected currency using current exchange rates.

**Validates: Requirements 15.3, 15.4**

### Property 42: Currency Detection

For any user location (based on IP or manual selection), the appropriate default currency should be selected from the supported currencies.

**Validates: Requirements 15.2**

### Property 43: Order Currency Recording

For any created order, the order record should include the currency used and the exchange rate at the time of order creation.

**Validates: Requirements 15.6**

### Property 44: Category Foreign Key Integrity

For any product, the CategoryId should reference a valid Category record in the database. Deleting a category with associated products should be prevented.

**Validates: Data model integrity for separate Category table**

### Property 45: Category-Product Relationship

For any category query, the returned category should include all products that reference that category via foreign key.

**Validates: Data model integrity for separate Category table**


## Testing Strategy

### Overview

The testing strategy employs a dual approach combining unit tests for specific examples and edge cases with property-based tests for universal correctness guarantees. This ensures both concrete bug prevention and general correctness verification across all layers of the application.

### Testing Pyramid

```
                    ┌─────────────┐
                    │   E2E Tests │  (Critical user flows)
                    └─────────────┘
                  ┌───────────────────┐
                  │ Integration Tests │  (API + DB + Services)
                  └───────────────────┘
              ┌─────────────────────────────┐
              │      Unit Tests             │  (Business logic)
              │  + Property-Based Tests     │  (Universal properties)
              └─────────────────────────────┘
```

### Backend Testing (C# / .NET)

#### Unit Testing

**Framework**: xUnit + FluentAssertions + Moq

**Coverage Goals**:
- Domain logic: 90%+
- Application services: 85%+
- API controllers: 80%+
- Utility functions: 95%+

**Unit Test Focus**:
- Domain entity behavior
- Use case/command handler logic
- Validation rules
- Business rule enforcement
- Edge cases (null, empty, boundary values)
- Error conditions

**Example Unit Tests**:
```csharp
public class ProductTests
{
    [Fact]
    public void UpdateInventory_WhenCountIsZero_ShouldMarkAsUnavailable()
    {
        // Arrange
        var product = new Product { InventoryCount = 10, IsAvailable = true };
        
        // Act
        product.UpdateInventory(0, "Sold out", "admin");
        
        // Assert
        product.IsAvailable.Should().BeFalse();
    }
    
    [Fact]
    public void UpdateInventory_ShouldRaiseDomainEvent()
    {
        // Arrange
        var product = new Product { InventoryCount = 10 };
        
        // Act
        product.UpdateInventory(5, "Adjustment", "admin");
        
        // Assert
        product.DomainEvents.Should().ContainSingle(e => e is InventoryChangedEvent);
    }
}

public class ProcessOrderCommandHandlerTests
{
    [Fact]
    public async Task Handle_WhenInventoryInsufficient_ShouldThrowException()
    {
        // Arrange
        var product = new Product { InventoryCount = 1 };
        var command = new ProcessOrderCommand { Items = new[] { new OrderItemDto { ProductId = product.Id, Quantity = 5 } } };
        
        var productRepo = new Mock<IProductRepository>();
        productRepo.Setup(r => r.GetByIdAsync(product.Id)).ReturnsAsync(product);
        
        var handler = new ProcessOrderCommandHandler(productRepo.Object, /* other deps */);
        
        // Act & Assert
        await Assert.ThrowsAsync<InsufficientInventoryException>(() => handler.Handle(command, CancellationToken.None));
    }
}
```

#### Property-Based Testing

**Framework**: FsCheck (F# property testing library for .NET)

**Configuration**:
- Minimum 100 iterations per property test
- Seed-based reproducibility for failed tests
- Shrinking to find minimal failing examples

**Property Test Requirements**:
- Each correctness property from the design document must have a corresponding property test
- Each test must include a comment tag: `// Feature: bymed-website, Property {number}: {property_text}`
- Tests should generate random valid inputs to verify universal properties

**Example Property Tests**:
```csharp
using FsCheck;
using FsCheck.Xunit;

public class CartPropertyTests
{
    // Feature: bymed-website, Property 5: Cart Total Calculation
    [Property(MaxTest = 100)]
    public Property CartTotal_ShouldEqualSumOfItemSubtotals()
    {
        return Prop.ForAll(
            Arb.Generate<List<CartItem>>().Where(items => items.All(i => i.Quantity > 0 && i.PriceAtAdd > 0)),
            cartItems =>
            {
                var cart = new Cart { Items = cartItems };
                var expectedTotal = cartItems.Sum(item => item.Quantity * item.PriceAtAdd);
                var actualTotal = cart.CalculateTotal();
                
                return (Math.Abs(actualTotal - expectedTotal) < 0.01m).Label($"Expected: {expectedTotal}, Actual: {actualTotal}");
            });
    }
    
    // Feature: bymed-website, Property 6: Cart Item Removal
    [Property(MaxTest = 100)]
    public Property RemoveItem_ShouldRecalculateTotalCorrectly()
    {
        return Prop.ForAll(
            Arb.Generate<Cart>().Where(c => c.Items.Count > 0),
            cart =>
            {
                var itemToRemove = cart.Items.First();
                var expectedTotal = cart.CalculateTotal() - (itemToRemove.Quantity * itemToRemove.PriceAtAdd);
                
                cart.RemoveItem(itemToRemove.ProductId);
                var actualTotal = cart.CalculateTotal();
                
                return (!cart.Items.Any(i => i.ProductId == itemToRemove.ProductId) && 
                        Math.Abs(actualTotal - expectedTotal) < 0.01m)
                    .Label($"Item removed and total recalculated correctly");
            });
    }
    
    // Feature: bymed-website, Property 32: Password Hashing
    [Property(MaxTest = 100)]
    public Property HashPassword_ShouldNeverReturnPlaintext()
    {
        return Prop.ForAll(
            Arb.Generate<string>().Where(s => s.Length >= 8),
            password =>
            {
                var hasher = new PasswordHasher<User>();
                var hashedPassword = hasher.HashPassword(null, password);
                
                return (hashedPassword != password && 
                        hashedPassword.Length > password.Length)
                    .Label($"Password hashed correctly");
            });
    }
}

public class OrderPropertyTests
{
    // Feature: bymed-website, Property 18: Order Filtering Accuracy
    [Property(MaxTest = 100)]
    public Property FilterOrders_ShouldReturnOnlyMatchingOrders()
    {
        return Prop.ForAll(
            Arb.Generate<List<Order>>(),
            Arb.Generate<OrderStatus>(),
            (orders, filterStatus) =>
            {
                var filtered = orders.Where(o => o.Status == filterStatus).ToList();
                
                return filtered.All(o => o.Status == filterStatus)
                    .Label($"All filtered orders have status {filterStatus}");
            });
    }
}
```

#### Integration Testing

**Focus**: Test interactions between layers, database, and external services

**Test Scenarios**:
- Complete checkout flow (cart → payment → order creation → email)
- Product management flow (create → update → delete)
- User registration and authentication flow
- Order status updates and notifications
- Inventory updates on order completion
- Category-Product relationship integrity

**Tools**:
- WebApplicationFactory for in-memory API testing
- Test database (PostgreSQL in Docker or in-memory)
- Mock external services (PayNow, email)

**Example Integration Test**:
```csharp
public class CheckoutIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    
    [Fact]
    public async Task CompleteCheckout_ShouldCreateOrderAndDecrementInventory()
    {
        // Arrange
        var client = _factory.CreateClient();
        var category = await CreateTestCategory();
        var product = await CreateTestProduct(category.Id, inventoryCount: 10);
        var user = await CreateTestUser();
        
        await AddToCart(client, user.Token, product.Id, quantity: 2);
        
        // Act
        var response = await client.PostAsJsonAsync("/api/orders", new
        {
            ShippingAddress = TestData.ValidAddress,
            PaymentDetails = TestData.ValidPaymentDetails,
            Currency = "USD"
        });
        
        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var order = await response.Content.ReadFromJsonAsync<OrderDto>();
        order.Should().NotBeNull();
        order.Total.Should().BeGreaterThan(0);
        
        // Verify inventory decremented
        var updatedProduct = await GetProduct(client, product.Id);
        updatedProduct.InventoryCount.Should().Be(8);
    }
}
```

### Frontend Testing (Next.js)

#### Unit Testing

**Framework**: Jest + React Testing Library

**Coverage Goals**:
- Components: 80%+
- Utility functions: 95%+
- API client functions: 85%+

**Example Tests**:
```typescript
describe('ProductCard', () => {
  it('should display product information', () => {
    const product = {
      id: '1',
      name: 'Test Product',
      price: 100,
      imageUrl: '/test.jpg',
      isAvailable: true
    };
    
    const { getByText, getByAltText } = render(<ProductCard product={product} />);
    
    expect(getByText('Test Product')).toBeInTheDocument();
    expect(getByText('$100')).toBeInTheDocument();
    expect(getByAltText('Test Product')).toBeInTheDocument();
  });
  
  it('should show out of stock message when unavailable', () => {
    const product = { ...testProduct, isAvailable: false };
    
    const { getByText } = render(<ProductCard product={product} />);
    
    expect(getByText('Out of Stock')).toBeInTheDocument();
  });
});
```

#### Property-Based Testing

**Framework**: fast-check

**Example Tests**:
```typescript
import fc from 'fast-check';

// Feature: bymed-website, Property 4: Cart Item Count Accuracy
describe('Property: Cart Item Count', () => {
  it('should always equal sum of quantities', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          productId: fc.uuid(),
          quantity: fc.integer({ min: 1, max: 100 })
        })),
        (cartItems) => {
          const expectedCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
          const actualCount = calculateCartItemCount(cartItems);
          expect(actualCount).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Admin Panel Testing (Angular)

#### Unit Testing

**Framework**: Jasmine + Karma / Jest

**Coverage Goals**:
- Components: 80%+
- Services: 90%+
- Pipes and directives: 95%+

**Example Tests**:
```typescript
describe('ProductListComponent', () => {
  it('should load products on init', () => {
    const mockProducts = [/* test data */];
    const productService = jasmine.createSpyObj('ProductService', ['getProducts']);
    productService.getProducts.and.returnValue(of(mockProducts));
    
    const component = new ProductListComponent(productService);
    component.ngOnInit();
    
    expect(component.products).toEqual(mockProducts);
  });
});
```

### End-to-End Testing

**Framework**: Playwright or Cypress

**Critical User Flows**:
1. Browse products → Add to cart → Checkout → Complete purchase
2. User registration → Login → View order history
3. Admin login → Create product → Verify on storefront
4. Admin update order status → Verify email sent
5. Search products → Filter by category → View product details
6. Admin create category → Create product in category → Verify relationship

**Test Environment**:
- Staging environment on VPS
- Test database with seed data
- Mock PayNow in test mode
- Test email service (capture emails)

**Example E2E Test**:
```typescript
test('complete checkout flow', async ({ page }) => {
  // Navigate to product page
  await page.goto('/products/test-product');
  
  // Add to cart
  await page.click('button:has-text("Add to Cart")');
  await expect(page.locator('.cart-count')).toHaveText('1');
  
  // Go to cart
  await page.click('a:has-text("Cart")');
  await expect(page.locator('.cart-item')).toBeVisible();
  
  // Proceed to checkout
  await page.click('button:has-text("Checkout")');
  
  // Fill shipping info
  await page.fill('input[name="name"]', 'Test User');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="address"]', '123 Test St');
  
  // Complete payment (mock)
  await page.click('button:has-text("Place Order")');
  
  // Verify confirmation
  await expect(page.locator('h1:has-text("Order Confirmed")')).toBeVisible();
});
```

### Test Data Management

**Strategies**:
- Use factories/builders for generating test data
- Seed database with realistic test data
- Clean up test data after each test
- Use transactions for test isolation (where possible)

**Example Factory (C#)**:
```csharp
public class ProductFactory
{
    private readonly Faker<Product> _faker;
    
    public ProductFactory()
    {
        _faker = new Faker<Product>()
            .RuleFor(p => p.Name, f => f.Commerce.ProductName())
            .RuleFor(p => p.Slug, (f, p) => p.Name.ToLowerInvariant().Replace(" ", "-"))
            .RuleFor(p => p.Description, f => f.Commerce.ProductDescription())
            .RuleFor(p => p.Price, f => f.Random.Decimal(10, 10000))
            .RuleFor(p => p.InventoryCount, f => f.Random.Int(0, 100))
            .RuleFor(p => p.IsAvailable, true);
    }
    
    public Product Build(Action<Product> customize = null)
    {
        var product = _faker.Generate();
        customize?.Invoke(product);
        return product;
    }
}
```

### Continuous Integration

**CI Pipeline** (GitHub Actions / GitLab CI / Azure DevOps):
1. Lint code (ESLint for TS, dotnet format for C#)
2. Type check (TypeScript, C# compilation)
3. Run backend unit tests
4. Run backend property-based tests
5. Run backend integration tests
6. Run frontend unit tests
7. Build applications
8. Run E2E tests (on staging)
9. Generate coverage reports
10. Security scanning (Snyk, OWASP Dependency Check)

**Quality Gates**:
- All tests must pass
- Code coverage must meet thresholds (80%+)
- No compilation errors
- No high-severity linting errors
- No critical security vulnerabilities

### Performance Testing

**Tools**: k6, Apache JMeter, or NBomber (.NET)

**Metrics to Track**:
- API response times (p50, p95, p99)
- Database query performance
- Throughput (requests per second)
- Error rates under load

**Load Testing Scenarios**:
- Concurrent users browsing products
- Multiple simultaneous checkouts
- Admin operations under load
- Database query performance with large datasets

**Example Load Test (k6)**:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function () {
  let response = http.get('https://api.bymed.com/api/products');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

### Security Testing

**Automated Security Scans**:
- Dependency vulnerability scanning (dotnet list package --vulnerable, npm audit)
- OWASP ZAP for common vulnerabilities
- SQL injection testing (handled by EF Core parameterization)
- XSS vulnerability testing

**Manual Security Review**:
- Authentication and authorization logic
- Payment processing flow (PayNow integration)
- Data encryption and storage
- API security (rate limiting, input validation)
- CORS configuration

### Accessibility Testing

**Tools**: axe-core, Lighthouse accessibility audit, Pa11y

**Requirements**:
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast
- Proper ARIA labels

### Testing Best Practices

1. **Test Naming**: Use descriptive test names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests clearly with setup, execution, and verification
3. **Test Isolation**: Each test should be independent and not rely on other tests
4. **Mock External Services**: Don't make real API calls to PayNow or email services in tests
5. **Fast Tests**: Keep unit tests fast (<100ms each) for quick feedback
6. **Deterministic Tests**: Avoid flaky tests that pass/fail randomly
7. **Test Documentation**: Document complex test scenarios and edge cases
8. **Property Test Balance**: Use property tests for universal rules, unit tests for specific examples

