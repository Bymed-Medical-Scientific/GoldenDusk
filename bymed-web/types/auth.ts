import type { UserRole } from "./enums";

export type AuthUserDto = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type AuthResponse = {
  user: AuthUserDto;
  token: string;
  refreshToken: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  name: string;
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
