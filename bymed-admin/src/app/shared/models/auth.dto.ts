export interface LoginRequestDto {
  readonly email: string;
  readonly password: string;
}

export interface AuthUserDto {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  /** String when API uses JsonStringEnumConverter; legacy responses may send 0/1. */
  readonly role: 'Customer' | 'Admin' | string | number;
  readonly isActive?: boolean;
}

export interface LoginResponseDto {
  readonly user: AuthUserDto;
  readonly token: string;
  readonly refreshToken: string;
}

export interface RegisterRequestDto {
  readonly email: string;
  readonly password: string;
  readonly name: string;
  /** Must match API `RegistrationChannel` JSON (PascalCase). */
  readonly registrationChannel: 'Storefront' | 'AdminPanel';
}

/** API auth/register body: tokens omitted when pending admin approval (202). */
export interface RegisterResponseDto {
  readonly user: AuthUserDto;
  readonly token?: string | null;
  readonly refreshToken?: string | null;
  readonly pendingAdminApproval?: boolean;
}

export type AdminRegisterOutcome =
  | { readonly kind: 'session'; readonly login: LoginResponseDto }
  | { readonly kind: 'pendingApproval' };

export interface ResetPasswordRequestDto {
  readonly email: string;
}

export interface RefreshTokenRequestDto {
  readonly refreshToken: string;
}

export interface RefreshTokenResponseDto {
  readonly token: string;
  readonly refreshToken: string;
}
