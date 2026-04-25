export interface QuoteRequestDto {
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

export interface PendingCustomerRegistrationDto {
  id: string;
  name: string;
  email: string;
  emailConfirmed: boolean;
  creationTime: string;
}
