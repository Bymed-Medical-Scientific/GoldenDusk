export type WithId = { id: string };

export type { ApiValidationIssue, PagedResult } from "./api-common";
export type {
  AuthResponse,
  AuthUserDto,
  ChangePasswordRequest,
  ConfirmResetPasswordRequest,
  LoginRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
  ResetPasswordRequest,
} from "./auth";
export type {
  AddToCartRequest,
  CartDto,
  CartItemDto,
} from "./cart";
export type {
  CategoryDto,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "./category";
export type { ContactFormDto, SubmitContactFormRequest } from "./contact";
export type {
  CurrencyDetectResponse,
  ExchangeRates,
} from "./currency";
export { OrderStatus, PaymentStatus, UserRole } from "./enums";
export type {
  AdjustInventoryRequest,
  InventoryDto,
  InventoryLogDto,
} from "./inventory";
export type {
  CreateOrderRequest,
  OrderAnalyticsResult,
  OrderDto,
  OrderItemDto,
  ShippingAddressDto,
  UpdateOrderStatusRequest,
} from "./order";
export type {
  ContentImageUploadDto,
  PageContentDto,
  PageMetadataDto,
  UpdatePageContentRequest,
} from "./page-content";
export type {
  PaymentInitiationResult,
  PaymentResult,
} from "./payments";
export type {
  CreateProductRequest,
  ProductDto,
  ProductImageDto,
  UpdateProductRequest,
} from "./product";
export type {
  UpdateProfileRequest,
  UpsertAddressRequest,
  UserAddressDto,
  UserProfileDto,
} from "./user";

