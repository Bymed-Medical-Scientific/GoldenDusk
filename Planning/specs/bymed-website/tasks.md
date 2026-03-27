# Implementation Plan: Bymed Medical & Scientific Website

## Overview

This implementation plan breaks down the Bymed e-commerce platform into discrete coding tasks following Clean Architecture principles. The system consists of three main components: a C# ASP.NET Core backend API, a Next.js customer-facing frontend, and an Angular admin panel. Tasks are organized to build incrementally, starting with core infrastructure and domain models, then adding application logic, and finally implementing the user interfaces.

# Tasks

- [x] 1. Set up backend project structure and core infrastructure
  - Create ASP.NET Core Web API project with Clean Architecture layers (Domain, Application, Infrastructure, Presentation)
  - Configure PostgreSQL database connection with Entity Framework Core
  - Set up dependency injection and project references
  - Configure Serilog for structured logging
  - Add required NuGet packages (EF Core, AutoMapper, FluentValidation, MediatR, Serilog)
  - _Requirements: 11.1, 11.2, 12.1_

- [x] 2. Implement domain entities and value objects
  - [x] 2.1 Create base entity classes and domain event infrastructure
    - Implement BaseEntity with Id, CreatedAt, UpdatedAt
    - Create domain event base class and event dispatcher
    - _Requirements: All requirements (foundational)_
  
  - [x] 2.2 Implement Category entity
    - Create Category entity with Name, Slug, Description, DisplayOrder
    - Add validation rules for required fields
    - _Requirements: 1.1, 6.2_
  
  - [x] 2.3 Implement Product entity with inventory management
    - Create Product entity with all properties (Name, Slug, Description, Price, CategoryId, InventoryCount, etc.)
    - Implement UpdateInventory method with domain event
    - Implement MarkAsUnavailable method
    - Add foreign key relationship to Category
    - _Requirements: 1.1, 1.3, 6.2, 9.2, 9.3_
  
  - [x] 2.4 Implement User, Cart, and Order entities
    - Create User entity with authentication properties
    - Create Cart and CartItem entities
    - Create Order, OrderItem, and Address entities
    - Implement order calculation methods
    - _Requirements: 2.1, 2.3, 3.1, 3.4, 4.1_
  
  - [x] 2.5 Implement supporting entities
    - Create ProductImage, PageContent, ContentVersion, InventoryLog entities
    - _Requirements: 1.3, 8.1, 8.4, 9.5_


- [x] 3. Configure Entity Framework Core and database
  - [x] 3.1 Create ApplicationDbContext with DbSets
    - Configure all entity DbSets
    - Implement OnModelCreating with entity configurations
    - Configure foreign key relationships (Category-Product)
    - Configure indexes for performance
    - Configure owned entities (Address, PageMetadata)
    - Configure JSON columns for Specifications
    - _Requirements: 1.1, 6.2, 9.1_
  
  - [x]* 3.2 Write property test for Category-Product foreign key integrity
    - **Property 44: Category Foreign Key Integrity**
    - **Validates: Requirements 6.2**
  
  - [x] 3.3 Create initial database migration
    - Generate EF Core migration for all entities
    - Review migration for correctness
    - _Requirements: All requirements (foundational)_
  
  - [x] 3.4 Implement repository interfaces and implementations
    - Create IProductRepository, ICategoryRepository, IOrderRepository, ICartRepository, IUserRepository
    - Implement concrete repositories with EF Core
    - Add pagination support for list queries
    - _Requirements: 1.1, 1.2, 2.1, 3.1, 6.1_
  
  - [x]* 3.5 Write property test for Category-Product relationship
    - **Property 45: Category-Product Relationship**
    - **Validates: Requirements 1.2**

- [ ] 4. Implement authentication and authorization
  - [x] 4.1 Configure ASP.NET Core Identity
    - Set up Identity with User entity
    - Configure password requirements (minimum 8 characters)
    - Configure JWT authentication
    - _Requirements: 4.1, 4.2, 12.2_
  
  - [x] 4.2 Create authentication services and DTOs
    - Implement IAuthService interface
    - Create RegisterRequest, LoginRequest, AuthResponse DTOs
    - Implement registration with email validation
    - Implement login with JWT token generation
    - Implement refresh token mechanism
    - Implement password reset functionality
    - _Requirements: 4.1, 4.2, 4.3, 4.6_
  
  - [x] 4.3 Write property test for password hashing
    - **Property 32: Password Hashing**
    - **Validates: Requirements 12.2**
  
  - [x] 4.4 Write property test for registration validation
    - **Property 11: Registration Validation**
    - **Validates: Requirements 4.2**
  
  - [x] 4.5 Write property test for authentication round trip
    - **Property 12: Authentication Round Trip**
    - **Validates: Requirements 4.3**
  
  - [x] 4.6 Create AuthController with endpoints
    - POST /api/auth/register
    - POST /api/auth/login
    - POST /api/auth/refresh
    - POST /api/auth/logout
    - POST /api/auth/reset-password
    - POST /api/auth/reset-password/confirm
    - POST /api/auth/change-password
    - _Requirements: 4.1, 4.2, 4.3, 4.6_
  
  - [x] 4.7 Configure role-based authorization
    - Create Customer and Admin roles
    - Configure authorization policies
    - Add [Authorize] attributes to admin endpoints
    - _Requirements: 12.4_
  
  - [x]* 4.8 Write property test for admin access control
    - **Property 34: Admin Access Control**
    - **Validates: Requirements 12.4**

- [x] 5. Checkpoint - Ensure authentication tests pass
  - Ensure all tests pass, ask the user if questions arise.


  - [x] 6.1 Create Category use cases and DTOs
    - Create CategoryDto, CreateCategoryRequest, UpdateCategoryRequest
    - Implement GetCategoriesQuery and handler
    - Implement GetCategoryByIdQuery and handler
    - Implement CreateCategoryCommand and handler
    - Implement UpdateCategoryCommand and handler
    - Implement DeleteCategoryCommand and handler (with validation for products)
    - _Requirements: 1.1, 6.2_
  
  - [x] 6.2 Create CategoriesController
    - GET /api/categories (list all)
    - GET /api/categories/{id}
    - POST /api/categories (admin only)
    - PUT /api/categories/{id} (admin only)
    - DELETE /api/categories/{id} (admin only)
    - _Requirements: 1.1, 6.2_
  
  - [x]* 6.3 Write unit tests for category CRUD operations
    - Test create, read, update, delete operations
    - Test delete validation when products exist
    - _Requirements: 6.2_

- [x] 7. Implement Product catalog management
  - [x] 7.1 Create Product use cases and DTOs
    - Create ProductDto, CreateProductRequest, UpdateProductRequest
    - Implement GetProductsQuery with filtering (categoryId, search, inStock) and pagination
    - Implement GetProductByIdQuery and handler
    - Implement CreateProductCommand and handler
    - Implement UpdateProductCommand and handler
    - Implement DeleteProductCommand and handler
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.2, 6.3, 6.6_
  
  - [x]* 7.2 Write property test for category filtering completeness
    - **Property 1: Category Filtering Completeness**
    - **Validates: Requirements 1.2**
  
  - [x]* 7.3 Write property test for product display completeness
    - **Property 2: Product Display Completeness**
    - **Validates: Requirements 1.3**
  
  - [x] 7.4 Create ProductsController
    - GET /api/products (with filtering and pagination)
    - GET /api/products/{id}
    - POST /api/products (admin only)
    - PUT /api/products/{id} (admin only)
    - DELETE /api/products/{id} (admin only)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.2, 6.3, 6.6_
  
  - [x]* 7.5 Write property test for product CRUD operations
    - **Property 15: Product CRUD Operations**
    - **Validates: Requirements 6.2, 6.3, 6.6**
  
  - [x]* 7.6 Write property test for product availability toggle
    - **Property 16: Product Availability Toggle**
    - **Validates: Requirements 6.4**
  
  - [x]* 7.7 Write property test for product changes propagation
    - **Property 17: Product Changes Propagation**
    - **Validates: Requirements 6.5**

- [x] 8. Implement file storage service for product images
  - [x] 8.1 Create IFileStorageService interface and implementation
    - Implement local file storage service
    - Add image upload validation (file type, size)
    - Generate optimized image sizes
    - Return public URLs for uploaded images
    - _Requirements: 1.3, 8.2_
  
  - [x]* 8.2 Write property test for image upload round trip
    - **Property 22: Image Upload Round Trip**
    - **Validates: Requirements 8.2**
  
  - [x] 8.3 Add image upload endpoint to ProductsController
    - POST /api/products/{id}/images
    - DELETE /api/products/{id}/images/{imageId}
    - _Requirements: 1.3, 8.2_


- [x] 9. Implement shopping cart functionality
  - [x] 9.1 Create Cart use cases and DTOs
    - Create CartDto, CartItemDto, AddToCartRequest
    - Implement GetCartQuery and handler (support both authenticated and guest users)
    - Implement AddToCartCommand and handler
    - Implement UpdateCartItemCommand and handler
    - Implement RemoveFromCartCommand and handler
    - Implement ClearCartCommand and handler
    - Implement cart total calculation logic
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x]* 9.2 Write property test for cart addition persistence
    - **Property 3: Cart Addition Persistence**
    - **Validates: Requirements 2.1**
  
  - [x]* 9.3 Write property test for cart item count accuracy
    - **Property 4: Cart Item Count Accuracy**
    - **Validates: Requirements 2.2**
  
  - [x]* 9.4 Write property test for cart total calculation
    - **Property 5: Cart Total Calculation**
    - **Validates: Requirements 2.3, 2.4**
  
  - [x]* 9.5 Write property test for cart item removal
    - **Property 6: Cart Item Removal**
    - **Validates: Requirements 2.5**
  
  - [x] 9.6 Create CartController
    - GET /api/cart
    - POST /api/cart/items
    - PUT /api/cart/items/{productId}
    - DELETE /api/cart/items/{productId}
    - DELETE /api/cart
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 10. Implement payment integration with PayNow
  - [x] 10.1 Create IPaymentService interface and PayNow implementation
    - Implement InitiatePaymentAsync method
    - Implement ConfirmPaymentAsync method
    - Implement HandleWebhookAsync method for payment status updates
    - Implement RefundPaymentAsync method
    - Add payment transaction logging
    - _Requirements: 3.3, 12.3_
  
  - [x] 10.2 Create payment webhook endpoint
    - POST /api/v1/payments/webhook (for PayNow callbacks)
    - Validate webhook signatures
    - Update order payment status
    - _Requirements: 3.3, 3.4_
  
- [x]* 10.3 Write property test for credit card non-storage
    - **Property 33: Credit Card Non-Storage**
    - **Validates: Requirements 12.3**

- [x] 11. Implement order processing and management
  - [x] 11.1 Create Order use cases and DTOs
    - Create OrderDto, CreateOrderRequest, UpdateOrderStatusRequest
    - Implement ProcessOrderCommand and handler (checkout flow)
    - Implement GetOrderByIdQuery and handler
    - Implement GetUserOrdersQuery and handler
    - Implement GetAllOrdersQuery with filtering (status, date range) and pagination
    - Implement UpdateOrderStatusCommand and handler
    - Implement GetOrderAnalyticsQuery and handler
    - Implement ExportOrdersQuery and handler (CSV format)
    - _Requirements: 3.1, 3.4, 4.4, 7.1, 7.2, 7.3, 7.5, 7.6_
  
  - [x]* 11.2 Write property test for checkout validation
    - **Property 7: Checkout Validation**
    - **Validates: Requirements 3.2**
  
  - [x]* 11.3 Write property test for order creation on payment success
    - **Property 8: Order Creation on Payment Success**
    - **Validates: Requirements 3.4**
  
  - [x]* 11.4 Write property test for cart preservation on payment failure
    - **Property 9: Cart Preservation on Payment Failure**
    - **Validates: Requirements 3.5**
  
  - [x]* 11.5 Write property test for order history retrieval
    - **Property 13: Order History Retrieval**
    - **Validates: Requirements 4.4**
  
  - [x]* 11.6 Write property test for order filtering accuracy
    - **Property 18: Order Filtering Accuracy**
    - **Validates: Requirements 7.2**
  
  - [x]* 11.7 Write property test for order status updates
    - **Property 19: Order Status Updates**
    - **Validates: Requirements 7.3**
  
  - [x]* 11.8 Write property test for order analytics calculation
    - **Property 20: Order Analytics Calculation**
    - **Validates: Requirements 7.5**
  
  - [x]* 11.9 Write property test for order export completeness
    - **Property 21: Order Export Completeness**
    - **Validates: Requirements 7.6**
  
  - [x] 11.10 Create OrdersController
    - POST /api/orders (create order / checkout)
    - GET /api/orders/my-orders (user's orders)
    - GET /api/orders/{id}
    - PUT /api/orders/{id}/status (admin only)
    - GET /api/orders (admin only, with filtering)
    - GET /api/orders/analytics (admin only)
    - GET /api/orders/export (admin only)
    - _Requirements: 3.1, 3.4, 4.4, 7.1, 7.2, 7.3, 7.5, 7.6_


- [x] 12. Implement inventory tracking system
  - [x] 12.1 Create Inventory use cases and DTOs
    - Create InventoryDto, InventoryLogDto, AdjustInventoryRequest
    - Implement GetInventoryQuery with filtering (lowStockOnly) and pagination
    - Implement AdjustInventoryCommand and handler (manual adjustments)
    - Implement GetInventoryHistoryQuery and handler
    - Implement GetLowStockProductsQuery and handler
    - Add automatic inventory decrement on order completion
    - Add automatic out-of-stock marking when inventory reaches zero
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x]* 12.2 Write property test for inventory decrement on order
    - **Property 25: Inventory Decrement on Order**
    - **Validates: Requirements 9.2**
  
  - [x]* 12.3 Write property test for out of stock marking
    - **Property 26: Out of Stock Marking**
    - **Validates: Requirements 9.3**
  
  - [x]* 12.4 Write property test for low stock alerts
    - **Property 27: Low Stock Alerts**
    - **Validates: Requirements 9.4**
  
  - [x]* 12.5 Write property test for inventory adjustment logging
    - **Property 28: Inventory Adjustment Logging**
    - **Validates: Requirements 9.5**
  
  - [x] 12.6 Create InventoryController
    - GET /api/inventory (admin only)
    - POST /api/inventory/adjust (admin only)
    - GET /api/inventory/history/{productId} (admin only)
    - GET /api/inventory/low-stock (admin only)
    - _Requirements: 9.1, 9.4, 9.5_

- [x] 13. Implement email notification service
  - [x] 13.1 Create IEmailService interface and implementation
    - Configure SendGrid or SMTP
    - Create email templates for order confirmation, shipping, delivery
    - Implement SendOrderConfirmationAsync method
    - Implement SendShippingNotificationAsync method
    - Implement SendDeliveryConfirmationAsync method
    - Implement SendContactFormEmailAsync method
    - Implement SendPasswordResetEmailAsync method
    - Add retry logic for failed emails
    - _Requirements: 3.6, 4.6, 7.4, 13.1, 13.2, 13.3, 13.4, 14.2_
  
  - [x]* 13.2 Write property test for email notification triggers
    - **Property 10: Email Notification Triggers**
    - **Validates: Requirements 3.6, 7.4, 13.1, 13.2, 13.3**
  
  - [x]* 13.3 Write property test for email content completeness
    - **Property 35: Email Content Completeness**
    - **Validates: Requirements 13.4**
  
  - [x] 13.4 Integrate email service with order processing
    - Trigger order confirmation email on order creation
    - Trigger shipping notification on status update to "shipped"
    - Trigger delivery confirmation on status update to "delivered"
    - _Requirements: 3.6, 7.4, 13.1, 13.2, 13.3_

- [x] 14. Implement content management system
  - [x] 14.1 Create PageContent use cases and DTOs
    - Create PageContentDto, UpdatePageContentRequest
    - Implement GetAllPagesQuery and handler
    - Implement GetPageBySlugQuery and handler
    - Implement UpdatePageContentCommand and handler
    - Implement version history tracking
    - _Requirements: 8.1, 8.3, 8.4_
  
  - [x]* 14.2 Write property test for content publishing visibility
    - **Property 23: Content Publishing Visibility**
    - **Validates: Requirements 8.3**
  
  - [x]* 14.3 Write property test for content version history
    - **Property 24: Content Version History**
    - **Validates: Requirements 8.4**
  
  - [x] 14.4 Create ContentController
    - GET /api/content (list all pages)
    - GET /api/content/{slug}
    - PUT /api/content/{slug} (admin only)
    - POST /api/content/images (admin only)
    - _Requirements: 8.1, 8.2, 8.3_


- [ ] 15. Implement currency conversion service
  - [x] 15.1 Create ICurrencyService interface and implementation
    - Implement GetExchangeRatesAsync method (fetch from external API)
    - Implement Convert method for currency conversion
    - Implement DetectCurrencyAsync method based on IP geolocation
    - Add caching for exchange rates (24-hour TTL)
    - Support USD, ZAR, KES, NGN currencies
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [x]* 15.2 Write property test for currency selection
    - **Property 41: Currency Selection**
    - **Validates: Requirements 15.3, 15.4**
  
  - [x]* 15.3 Write property test for currency detection
    - **Property 42: Currency Detection**
    - **Validates: Requirements 15.2**
  
  - [x]* 15.4 Write property test for order currency recording
    - **Property 43: Order Currency Recording**
    - **Validates: Requirements 15.6**
  
  - [x] 15.5 Create CurrencyController
    - GET /api/currency/rates
    - GET /api/currency/detect
    - _Requirements: 15.1, 15.2, 15.5_

- [ ] 16. Implement user profile management
  - [x] 16.1 Create User profile use cases and DTOs
    - Create DTOs:
      - UserProfileDto (id, email, firstName, lastName, phoneNumber)
      - UserAddressDto (id, label, line1, line2, city, state, postalCode, country, isDefault)
      - UpdateProfileRequest (firstName, lastName, phoneNumber)
      - AddAddressRequest / UpdateAddressRequest (address fields + label)
    - Implement GetUserProfileQuery and handler
      - Resolve current authenticated user from JWT claims
      - Return profile with addresses sorted by isDefault desc, createdAt desc
    - Implement UpdateUserProfileCommand and handler
      - Validate input (length, required fields, phone format)
      - Update only allowed profile fields (no role/email mutation in this flow)
    - Implement address management use cases and handlers
      - AddUserAddressCommand
      - UpdateUserAddressCommand
      - DeleteUserAddressCommand
      - SetDefaultUserAddressCommand
      - Enforce one default address per user (transactional update)
      - Prevent cross-user address access/modification
    - Add FluentValidation validators and mapping profiles for all request models
    - Add structured logging and error handling for profile/address operations
    - _Requirements: 4.4, 4.5_
  
  - [x]* 16.2 Write property test for profile update persistence
    - **Property 14: Profile Update Persistence**
    - **Validates: Requirements 4.5**
  
  - [x] 16.3 Create UsersController
    - GET /api/users/profile
    - PUT /api/users/profile
    - GET /api/users/addresses
    - POST /api/users/addresses
    - PUT /api/users/addresses/{id}
    - DELETE /api/users/addresses/{id}
    - _Requirements: 4.4, 4.5_

- [x] 17. Implement contact form functionality
  - [x] 17.1 Create contact form use cases and DTOs
    - Create ContactFormDto, SubmitContactFormRequest
    - Implement SubmitContactFormCommand and handler
    - Add email validation
    - Integrate with email service
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  
  - [x]* 17.2 Write property test for contact form submission
    - **Property 36: Contact Form Submission**
    - **Validates: Requirements 14.2**
  
  - [x]* 17.3 Write property test for contact form confirmation
    - **Property 37: Contact Form Confirmation**
    - **Validates: Requirements 14.3**
  
  - [x]* 17.4 Write property test for contact form validation
    - **Property 38: Contact Form Validation**
    - **Validates: Requirements 14.4**
  
  - [x]* 17.5 Write property test for form error preservation
    - **Property 40: Form Error Preservation**
    - **Validates: Requirements 14.6**
  
  - [x] 17.6 Create ContactController
    - POST /api/contact
    - _Requirements: 14.1, 14.2, 14.3_

- [x] 18. Configure API security and middleware
  - [x] 18.1 Configure HTTPS and security headers
    - Enforce HTTPS on all endpoints
    - Add HSTS headers
    - Configure CORS for frontend domains
    - _Requirements: 12.1_
  
  - [x] 18.2 Implement rate limiting
    - Configure rate limits for all endpoints
    - Stricter limits for authentication endpoints (5 per 15 minutes)
    - Use AspNetCoreRateLimit middleware
    - _Requirements: 12.2_
  
  - [x] 18.3 Add global exception handler
    - Implement custom exception handler middleware
    - Return standardized error responses
    - Log all exceptions with Serilog
    - _Requirements: All requirements (error handling)_
  
  - [x] 18.4 Configure request validation and size limits
    - Add FluentValidation for all commands
    - Limit request payload sizes (10MB max)
    - Add request timeout (30 seconds)
    - _Requirements: 3.2, 4.2_

- [x] 19. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [x] 20. Set up Next.js customer frontend project
  - [x] 20.1 Initialize Next.js project with TypeScript
    - Create Next.js 14+ project with App Router
    - Configure TypeScript
    - Install and configure Tailwind CSS
    - Set up project structure (app, components, lib, types)
    - _Requirements: 5.5, 11.1_
  
  - [x] 20.2 Create API client and types
    - Create TypeScript interfaces for all public API DTOs and requests (auth, products, categories, cart, orders, users, CMS content, contact, currency, inventory, payments, shared pagination)
    - Implement API client functions for all customer-relevant backend endpoints (admin and health included where applicable; PayNow webhook remains server-only)
    - Add error handling and retry logic
    - Configure base URL and authentication headers
    - _Requirements: All requirements (frontend foundation)_
  
  - [x] 20.3 Implement authentication context and hooks
    - Create AuthContext for managing user session
    - Implement useAuth hook
    - Add token storage (httpOnly cookies)
    - Implement automatic token refresh
    - Add protected route wrapper
    - _Requirements: 4.1, 4.3, 12.1_

- [ ] 21. Implement customer frontend layout and navigation
  - [x] 21.1 Create main layout with header and footer
    - Implement Header component with logo, navigation, search bar, cart icon, user menu
    - Implement Footer component with company info, links, contact details
    - Add responsive mobile menu
    - _Requirements: 5.1, 5.3, 5.4, 5.5_
  
  - [x]* 21.2 Write property test for footer contact information
    - **Property 39: Footer Contact Information**
    - **Validates: Requirements 14.5**
  
  - [x] 21.3 Implement currency selector component
    - Add currency dropdown to header
    - Persist currency selection to localStorage
    - Update all prices when currency changes
    - _Requirements: 15.2, 15.3, 15.4_

- [x] 22. Implement product catalog pages
  - [x] 22.1 Create product listing page
    - Implement ProductCard component
    - Implement ProductGrid component with pagination
    - Add category filter sidebar
    - Add search functionality
    - Implement SSR for SEO
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 22.2 Create product detail page
    - Implement ProductDetail component with image gallery
    - Display product information (name, description, price, availability)
    - Add "Add to Cart" button
    - Implement related products section
    - Implement SSR for SEO
    - Add structured data markup for products
    - _Requirements: 1.3, 2.1, 10.5_
  
  - [x]* 22.3 Write unit tests for product display
    - Test ProductCard renders all required information
    - Test out-of-stock display
    - Test price formatting with currency
    - _Requirements: 1.3_

- [ ] 23. Implement shopping cart functionality
  - [x] 23.1 Create cart page and components
    - Implement CartItem component
    - Implement CartSummary component
    - Add quantity adjustment controls
    - Add remove item functionality
    - Display real-time total calculation
    - Persist cart to localStorage for guest users
    - Sync cart with backend for authenticated users
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 23.2 Implement cart icon with item count
    - Add cart icon to header
    - Display item count badge
    - Update count when items added/removed
    - _Requirements: 2.2_
  
  - [x]* 23.3 Write unit tests for cart functionality
    - Test cart total calculation
    - Test quantity updates
    - Test item removal
    - Test cart persistence
    - _Requirements: 2.3, 2.4, 2.5_


- [x] 24. Implement checkout flow
  - [x] 24.1 Create checkout page with multi-step form
    - Implement shipping address form with validation
    - Implement contact information form
    - Implement payment details form (PayNow integration)
    - Implement order review step
    - Add form validation with error messages
    - _Requirements: 3.1, 3.2_
  
  - [x] 24.2 Implement payment processing
    - Integrate with PayNow payment gateway
    - Handle payment success and failure
    - Display loading states during payment
    - Implement error handling and retry logic
    - _Requirements: 3.3, 3.4, 3.5_
  
  - [x] 24.3 Create order confirmation page
    - Display order details and confirmation message
    - Show order number and tracking information
    - Add link to order history
    - _Requirements: 3.4, 3.6_
  
  - [x]* 24.4 Write unit tests for checkout validation
    - Test form validation
    - Test required field checks
    - Test payment error handling
    - _Requirements: 3.2_

- [x] 25. Implement user account pages
  - [x] 25.1 Create registration and login pages
    - Implement registration form with validation
    - Implement login form
    - Add password strength indicator
    - Display validation errors
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 25.2 Create user profile page
    - Display user information
    - Implement profile edit form
    - Add saved addresses management
    - Implement password change form
    - _Requirements: 4.4, 4.5, 4.6_
  
  - [x] 25.3 Create order history page
    - Display list of user's orders
    - Show order status and details
    - Add order detail view
    - Implement order tracking
    - _Requirements: 4.4_
  
  - [x]* 25.4 Write unit tests for authentication forms
    - Test registration validation
    - Test login flow
    - Test password reset
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 26. Implement content pages
  - [x] 26.1 Create About page
    - Fetch content from backend API
    - Render company overview, mission, services
    - Implement SSG for performance
    - Add proper meta tags for SEO
    - _Requirements: 5.1, 5.2, 10.1, 10.2_
  
  - [x] 26.2 Create Services page
    - Fetch content from backend API
    - Display technical training and support services
    - Implement SSG for performance
    - Add proper meta tags for SEO
    - _Requirements: 5.2, 10.1, 10.2_
  
  - [x] 26.3 Create Contact page
    - Implement contact form with validation
    - Display contact information (phone, email, address)
    - Show confirmation message on successful submission
    - Preserve form data on error
    - _Requirements: 5.3, 14.1, 14.2, 14.3, 14.4, 14.6_
  
  - [x]* 26.4 Write property test for HTML semantic structure
    - **Property 29: HTML Semantic Structure**
    - **Validates: Requirements 10.1**
  
  - [x]* 26.5 Write property test for page metadata completeness
    - **Property 30: Page Metadata Completeness**
    - **Validates: Requirements 10.2, 10.4, 10.5**

- [x] 27. Implement SEO and performance optimizations
  - [x] 27.1 Add SEO metadata to all pages
    - Implement meta title and description for all pages
    - Add Open Graph tags for social sharing
    - Generate sitemap.xml
    - Add robots.txt
    - _Requirements: 10.2, 10.3, 10.4_
  
  - [x]* 27.2 Write property test for sitemap completeness
    - **Property 31: Sitemap Completeness**
    - **Validates: Requirements 10.3**
  
  - [x] 27.3 Optimize images and assets
    - Use Next.js Image component for all images
    - Implement lazy loading for below-the-fold images
    - Add blur placeholders
    - Optimize bundle size with code splitting
    - _Requirements: 11.3, 11.4_
  
  - [x] 27.4 Implement caching strategy
    - Configure cache headers for static assets
    - Implement stale-while-revalidate for product data
    - Add service worker for offline support (optional)
    - _Requirements: 11.4_

- [x] 28. Checkpoint - Ensure frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [x] 29. Set up Angular admin panel project
  - [x] 29.1 Initialize Angular project
    - Create Angular 17 project with standalone components and strict mode enabled
    - Configure TypeScript with strict compiler options and path aliases (`@core`, `@shared`, `@features`)
    - Install and configure Angular Material as the default UI component library
    - Set up project structure for clean separation (`core`, `shared`, `features`, `layout`)
    - Configure environment files (`environment.ts`, `environment.prod.ts`) for API base URL and runtime flags
    - Add baseline app shell with routing, global error UI, and loading state conventions
    - _Requirements: 6.1, 7.1, 8.1_
  
  - [x] 29.2 Create API service and models
    - Create TypeScript interfaces for all DTOs
    - Implement API service with HttpClient
    - Add authentication interceptor for JWT tokens
    - Add error handling interceptor
    - _Requirements: All admin requirements_
  
  - [x] 29.3 Implement authentication for admin panel
    - Create login page
    - Implement AuthService with login/logout
    - Add route guards for protected routes
    - Store JWT token securely
    - _Requirements: 6.1, 12.4_

- [ ] 30. Implement admin dashboard
- [x] 30.1 Create dashboard layout with navigation
    - Implement sidebar navigation
    - Create header with user menu
    - Add responsive layout
    - _Requirements: 6.1, 7.1, 8.1_
  
  - [x] 30.2 Create dashboard overview page
    - Display sales summary widget (today, week, month)
    - Display recent orders widget
    - Display low stock alerts widget
    - Display popular products widget
    - Add quick action buttons
    - _Requirements: 7.5, 9.4_

- [x] 31. Implement category management module
  - [x] 31.1 Create category list component
    - Display all categories in table/grid
    - Add search and filter functionality
    - Add create/edit/delete actions
    - Implement sorting and pagination
    - _Requirements: 6.2_
  
  - [x] 31.2 Create category form component
    - Implement create/edit form with validation
    - Add name, slug, description, display order fields
    - Display validation errors
    - _Requirements: 6.2_
  
  - [x]* 31.3 Write unit tests for category management
    - Test category list display
    - Test form validation
    - Test CRUD operations
    - _Requirements: 6.2_

- [x] 32. Implement product management module
  - [x] 32.1 Create product list component
    - Display products in table with search and filters
    - Add filter by category, availability, stock level
    - Add create/edit/delete actions
    - Implement pagination
    - _Requirements: 6.1, 6.2, 6.3, 6.6_
  
  - [x] 32.2 Create product form component
    - Implement create/edit form with validation
    - Add rich text editor for description
    - Add image upload with preview
    - Add category dropdown (populated from Category table)
    - Add price, inventory, SKU, availability fields
    - Display validation errors
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [x] 32.3 Implement bulk operations
    - [x] Add table row selection and select-all support in admin product list
    - [x] Add bulk delete functionality (UI action + API endpoint + application handler)
    - [x] Add bulk availability toggle (UI action + API endpoint + application handler)
    - [x] Add export functionality (CSV endpoint + admin download action)
    - [x] Add import functionality (CSV upload endpoint + admin upload action)
    - [x] Add operation result feedback and selection reset behavior in UI
    - _Requirements: 6.2, 6.6_
  
  - [x] 32.4 Write unit tests for product management
    - [x] `ProductListComponent`: load/render, search filter, bulk availability/delete, export/import, error paths
    - [x] `ProductFormComponent`: validation messages, create payload + navigation, image upload after create, server field errors
    - _Requirements: 6.2, 6.3_

- [x] 33. Implement order management module
  - [x] 33.1 Create order list component
    - [x] `OrderListComponent` at `/orders` with Material table, loading/error states
    - [x] Filters: status, date range (API `dateFrom`/`dateTo`), search (order number, name, email — backend `search` query)
    - [x] Pagination via `MatPaginator` + `getOrders` query params
    - [x] Columns: order number, customer (name + email), total, status chip, placed date
    - _Requirements: 7.1, 7.2_
  
  - [x] 33.2 Create order detail component
    - [x] `OrderDetailComponent` at `/orders/:id` via `getOrderById` (loading / 404 / error states)
    - [x] Summary: totals, currency, order + payment status chips
    - [x] Customer block + formatted shipping address + line items table (qty, unit, line total)
    - [x] Payment block: method, reference, payment status, tracking, notes
    - [x] Timeline card: placed, fulfillment, payment, tracking, last update (derived; no separate audit table yet)
    - [x] Order list links to detail (order number + view action)
    - _Requirements: 7.1_
  
  - [x] 33.3 Implement order status management
    - [x] Status dropdown on order detail (allowed transitions aligned with backend workflow)
    - [x] `PUT orders/{id}/status` via `AdminApiService.updateOrderStatus` + optional notes
    - [x] Tracking number required when moving to **Shipped**; confirmation dialog before apply
    - [x] Stronger confirm + warn styling when cancelling an order
    - _Requirements: 7.3, 7.4_
  
  - [ ] 33.4 Create order analytics page
    - Display sales charts (by day, week, month)
    - Show total revenue, order count, average order value
    - Add date range selector
    - Display top products
    - _Requirements: 7.5_
  
  - [ ] 33.5 Implement order export functionality
    - Add export to CSV button
    - Allow filtering before export
    - Generate CSV with all order data
    - _Requirements: 7.6_
  
  - [ ]* 33.6 Write unit tests for order management
    - Test order list display
    - Test filtering
    - Test status updates
    - Test analytics calculations
    - _Requirements: 7.1, 7.2, 7.3, 7.5_


- [ ] 34. Implement inventory management module
  - [ ] 34.1 Create inventory list component
    - Display products with inventory levels
    - Add filter for low stock items
    - Show inventory count, low stock threshold, availability
    - Add search functionality
    - Implement pagination
    - _Requirements: 9.1, 9.4_
  
  - [ ] 34.2 Create inventory adjustment component
    - Implement adjustment form with product selector
    - Add new count input and reason field
    - Display current inventory level
    - Show confirmation dialog
    - _Requirements: 9.5_
  
  - [ ] 34.3 Create inventory history component
    - Display inventory change log for selected product
    - Show previous count, new count, change amount, reason, user, timestamp
    - Add date range filter
    - Implement pagination
    - _Requirements: 9.5_
  
  - [ ] 34.4 Implement low stock alerts
    - Display prominent alerts for low stock products
    - Add notification badge in navigation
    - Allow setting custom thresholds per product
    - _Requirements: 9.4_
  
  - [ ]* 34.5 Write unit tests for inventory management
    - Test inventory list display
    - Test adjustment form validation
    - Test history display
    - Test low stock alerts
    - _Requirements: 9.1, 9.4, 9.5_

- [ ] 35. Implement content management module
  - [ ] 35.1 Create content list component
    - Display all pages (About, Services, Contact)
    - Show page title, slug, last updated
    - Add edit action
    - _Requirements: 8.1_
  
  - [ ] 35.2 Create content editor component
    - Implement rich text editor (TinyMCE or CKEditor)
    - Add image upload functionality
    - Add meta title and description fields
    - Add preview mode
    - Implement publish/draft workflow
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ] 35.3 Implement version history
    - Display list of previous versions
    - Show timestamp and author for each version
    - Allow viewing previous versions
    - Allow reverting to previous version
    - _Requirements: 8.4_
  
  - [ ]* 35.4 Write unit tests for content management
    - Test content list display
    - Test editor functionality
    - Test version history
    - _Requirements: 8.1, 8.3, 8.4_

- [ ] 36. Implement admin panel error handling and UX
  - [ ] 36.1 Add global error handler
    - Implement custom ErrorHandler
    - Display user-friendly error messages
    - Log errors to backend
    - Add retry options
    - _Requirements: All admin requirements_
  
  - [ ] 36.2 Add loading states and progress indicators
    - Add loading spinners for async operations
    - Add progress bars for file uploads
    - Add skeleton loaders for data tables
    - _Requirements: All admin requirements_
  
  - [ ] 36.3 Add confirmation dialogs
    - Implement confirmation for delete operations
    - Add confirmation for status changes
    - Add confirmation for bulk operations
    - _Requirements: 6.6, 7.3_

- [ ] 37. Checkpoint - Ensure admin panel tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 38. Set up VPS deployment infrastructure
  - [ ] 38.1 Configure VPS server
    - Install Ubuntu 22.04 LTS or Debian 12
    - Install .NET 8.0 Runtime
    - Install Node.js 20+ LTS
    - Install PostgreSQL 15+
    - Install Redis 7+ (optional)
    - Install Nginx
    - Configure firewall (UFW) to allow ports 80, 443, 22
    - _Requirements: 11.6, 12.1_
  
  - [ ] 38.2 Configure PostgreSQL database
    - Create database and user
    - Configure connection pooling
    - Set up automated backups
    - Optimize PostgreSQL configuration (shared_buffers, work_mem)
    - _Requirements: 11.6_
  
  - [ ] 38.3 Configure Nginx as reverse proxy
    - Set up Nginx configuration for API and frontend
    - Configure SSL with Let's Encrypt (Certbot)
    - Enable gzip compression
    - Configure caching headers
    - Enable HTTP/2
    - _Requirements: 11.1, 11.4, 12.1_
  
  - [ ] 38.4 Configure systemd service for backend API
    - Create systemd service file for ASP.NET Core API
    - Configure automatic restart on failure
    - Set up logging
    - Enable service on boot
    - _Requirements: 11.6_

- [ ] 39. Deploy backend API to VPS
  - [ ] 39.1 Build and publish backend API
    - Build ASP.NET Core API in Release mode
    - Publish as self-contained or framework-dependent
    - Copy files to VPS via SSH/SFTP
    - _Requirements: 11.6_
  
  - [ ] 39.2 Configure environment variables
    - Set database connection string
    - Set JWT secret key
    - Set PayNow API credentials
    - Set email service credentials
    - Set file storage configuration
    - _Requirements: 12.1_
  
  - [ ] 39.3 Run database migrations
    - Execute EF Core migrations on production database
    - Seed initial data (categories, admin user)
    - Verify database schema
    - _Requirements: All requirements (data foundation)_
  
  - [ ] 39.4 Start and verify backend API
    - Start systemd service
    - Verify API health endpoint
    - Test authentication endpoints
    - Test product endpoints
    - _Requirements: All backend requirements_

- [ ] 40. Deploy customer frontend to VPS
  - [ ] 40.1 Build Next.js frontend
    - Configure environment variables (API URL)
    - Build Next.js in production mode
    - Generate static assets
    - _Requirements: 11.1, 11.2_
  
  - [ ] 40.2 Deploy frontend to VPS
    - Copy build files to VPS
    - Configure Nginx to serve Next.js
    - Set up PM2 or systemd for Next.js server (if using SSR)
    - _Requirements: 11.1_
  
  - [ ] 40.3 Verify frontend deployment
    - Test homepage loads
    - Test product catalog
    - Test cart functionality
    - Test checkout flow
    - _Requirements: All customer frontend requirements_

- [ ] 41. Deploy admin panel to VPS
  - [ ] 41.1 Build Angular admin panel
    - Configure environment variables (API URL)
    - Build Angular in production mode with AOT
    - _Requirements: 6.1_
  
  - [ ] 41.2 Deploy admin panel to VPS
    - Copy build files to VPS
    - Configure Nginx to serve Angular app
    - Set up separate subdomain or path (e.g., admin.bymed.com or /admin)
    - _Requirements: 6.1_
  
  - [ ] 41.3 Verify admin panel deployment
    - Test admin login
    - Test product management
    - Test order management
    - Test content management
    - _Requirements: All admin requirements_

- [ ] 42. Configure monitoring and logging
  - [ ] 42.1 Set up application logging
    - Configure Serilog to write to files
    - Set up log rotation
    - Configure log levels for production
    - _Requirements: 11.6_
  
  - [ ] 42.2 Set up monitoring (optional)
    - Install and configure Prometheus (optional)
    - Set up Grafana dashboards (optional)
    - Configure health check endpoints
    - Set up uptime monitoring
    - _Requirements: 11.6_
  
  - [ ] 42.3 Configure error tracking
    - Set up error logging to file or external service
    - Configure alerts for critical errors
    - _Requirements: 11.6_

- [ ] 43. Final integration testing and verification
  - [ ] 43.1 Test complete user flows
    - Test product browsing and search
    - Test cart and checkout flow end-to-end
    - Test user registration and login
    - Test order placement and confirmation
    - Test email notifications
    - _Requirements: All customer requirements_
  
  - [ ] 43.2 Test admin workflows
    - Test product creation and management
    - Test category management
    - Test order management and status updates
    - Test inventory adjustments
    - Test content updates
    - _Requirements: All admin requirements_
  
  - [ ] 43.3 Test payment integration
    - Test PayNow payment flow in production mode
    - Test payment success scenario
    - Test payment failure scenario
    - Verify webhook handling
    - _Requirements: 3.3, 3.4, 3.5_
  
  - [ ] 43.4 Verify security configurations
    - Verify HTTPS is enforced
    - Test authentication and authorization
    - Verify rate limiting is working
    - Test CORS configuration
    - Verify sensitive data is not exposed
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ] 43.5 Performance testing
    - Test page load times (homepage < 3s, product pages < 2s)
    - Test API response times
    - Test concurrent user scenarios
    - Verify caching is working
    - _Requirements: 11.1, 11.2, 11.4, 11.5_
  
  - [ ] 43.6 SEO verification
    - Verify meta tags on all pages
    - Verify sitemap.xml is accessible
    - Verify robots.txt is configured
    - Test Open Graph tags
    - Run Lighthouse SEO audit (target score > 90)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6_

- [ ] 44. Final checkpoint - Production readiness verification
  - Ensure all tests pass, verify all features are working correctly in production, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation follows Clean Architecture with clear separation of concerns
- Backend uses C# ASP.NET Core with Entity Framework Core and PostgreSQL
- Customer frontend uses Next.js 14+ with TypeScript and Tailwind CSS
- Admin panel uses Angular 17+ with standalone components
- Deployment targets a VPS with Nginx, systemd, and PostgreSQL
- Categories are stored in a separate database table with foreign key relationships to Products
