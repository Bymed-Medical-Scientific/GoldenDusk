export interface PendingAdminRegistrationDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly emailConfirmed: boolean;
  readonly creationTime: string;
}
