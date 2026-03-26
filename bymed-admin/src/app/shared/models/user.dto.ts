export interface UserSummaryDto {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly roles: string[];
  readonly isActive: boolean;
}
