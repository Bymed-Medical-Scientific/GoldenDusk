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

export interface PendingCustomerRegistrationDto {
  id: string;
  name: string;
  email: string;
  emailConfirmed: boolean;
  creationTime: string;
}
