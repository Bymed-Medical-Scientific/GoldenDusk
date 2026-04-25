export interface ContactMessageDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly subject: string;
  readonly message: string;
  readonly submittedAtUtc: string;
}

export interface ContactNotificationRecipientDto {
  readonly id: string;
  readonly email: string;
  readonly isPrimaryRecipient: boolean;
  readonly isActive: boolean;
  readonly createdAtUtc: string;
}

export interface CreateContactNotificationRecipientRequestDto {
  readonly email: string;
  readonly isPrimaryRecipient: boolean;
}
