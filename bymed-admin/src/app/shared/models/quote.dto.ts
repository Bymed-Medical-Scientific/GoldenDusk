export interface QuoteRequestSummaryDto {
  id: string;
  fullName: string;
  institution: string;
  email: string;
  phoneNumber: string;
  address: string;
  notes: string;
  status: number;
  submittedAtUtc: string;
  itemCount: number;
}

export interface QuoteRequestItemDto {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
}

export interface QuoteRequestDetailDto {
  id: string;
  fullName: string;
  institution: string;
  email: string;
  phoneNumber: string;
  address: string;
  notes: string;
  status: number;
  submittedAtUtc: string;
  items: QuoteRequestItemDto[];
}

export type QuoteRequestDto = QuoteRequestSummaryDto;

export interface CurrencyDefinitionDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly symbol: string;
  readonly decimalPlaces: number;
  readonly isActive: boolean;
}

export interface CreateCurrencyDefinitionRequestDto {
  readonly code: string;
  readonly name: string;
  readonly symbol?: string | null;
  readonly decimalPlaces: number;
  readonly isActive: boolean;
}

export interface UpdateCurrencyDefinitionRequestDto {
  readonly name: string;
  readonly symbol?: string | null;
  readonly decimalPlaces: number;
  readonly isActive: boolean;
}

export interface QuotationItemDto {
  readonly id: string;
  readonly productId: string;
  readonly productNameSnapshot: string;
  readonly productSkuSnapshot: string;
  readonly productImageUrlSnapshot: string;
  readonly quantity: number;
  readonly supplierUnitCost: number;
  readonly sourceCurrencyCode: string;
  readonly exchangeRateToTarget: number;
  readonly markupMultiplier: number;
  readonly unitPriceExcludingVat: number;
  readonly unitVatAmount: number;
  readonly unitPriceIncludingVat: number;
  readonly lineSubtotalExcludingVat: number;
  readonly lineVatAmount: number;
  readonly lineTotalIncludingVat: number;
}

export interface QuotationSummaryDto {
  readonly id: string;
  readonly quotationNumber: string;
  readonly status: number;
  readonly customerName: string;
  readonly customerInstitution: string;
  readonly subject: string;
  readonly hasPurchaseOrder?: boolean | null;
  readonly purchaseOrderReference?: string | null;
  readonly subtotalExcludingVat: number;
  readonly vatAmount: number;
  readonly totalIncludingVat: number;
  readonly targetCurrencyCode: string;
  readonly createdAtUtc: string;
  readonly finalizedAtUtc?: string | null;
}

export interface QuotationDetailDto extends QuotationSummaryDto {
  readonly customerEmail: string;
  readonly customerPhone: string;
  readonly customerAddress: string;
  readonly notes?: string | null;
  readonly termsAndConditions?: string | null;
  readonly vatPercent: number;
  readonly showVatOnDocument: boolean;
  readonly items: QuotationItemDto[];
}

export interface CreateQuotationRequestDto {
  readonly customerName: string;
  readonly customerInstitution: string;
  readonly customerEmail: string;
  readonly customerPhone: string;
  readonly customerAddress: string;
  readonly subject: string;
  readonly targetCurrencyCode: string;
  readonly vatPercent: number;
  readonly showVatOnDocument: boolean;
  readonly notes?: string | null;
  readonly termsAndConditions?: string | null;
}

export interface UpdateQuotationRequestDto extends CreateQuotationRequestDto {}

export interface UpsertQuotationItemRequestDto {
  readonly productId: string;
  readonly productNameSnapshot: string;
  readonly productSkuSnapshot?: string | null;
  readonly productImageUrlSnapshot?: string | null;
  readonly quantity: number;
  readonly supplierUnitCost: number;
  readonly sourceCurrencyCode: string;
  readonly exchangeRateToTarget: number;
  readonly markupMultiplier: number;
}

export interface UpdateQuotationPurchaseOrderRequestDto {
  readonly hasPurchaseOrder: boolean;
  readonly purchaseOrderReference?: string | null;
}

export interface PendingCustomerRegistrationDto {
  id: string;
  name: string;
  email: string;
  emailConfirmed: boolean;
  creationTime: string;
}
