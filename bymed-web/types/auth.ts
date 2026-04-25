import type { UserRole } from "./enums";

export type AuthUserDto = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailConfirmed?: boolean;
  isActive: boolean;
};

export type AuthResponse = {
  user: AuthUserDto;
  token?: string;
  refreshToken?: string;
  pendingAdminApproval?: boolean;
};

export type LoginRequest = {
  email: string;
  password: string;
};

/** Must match API enum names (PascalCase) when sent as JSON string. */
export type RegistrationChannel = "Storefront" | "AdminPanel";

export type RegisterRequest = {
  email: string;
  password: string;
  name: string;
  registrationChannel?: RegistrationChannel;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type RefreshTokenResponse = {
  token: string;
  refreshToken: string;
};

export type ResetPasswordRequest = {
  email: string;
};

export type ConfirmResetPasswordRequest = {
  email: string;
  token: string;
  newPassword: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};
