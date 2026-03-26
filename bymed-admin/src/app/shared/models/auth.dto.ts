export interface LoginRequestDto {
  readonly email: string;
  readonly password: string;
}

export interface LoginResponseDto {
  readonly token: string;
  readonly refreshToken: string;
  readonly expiresAtUtc: string;
  readonly userId: string;
  readonly roles: string[];
}

export interface RefreshTokenRequestDto {
  readonly refreshToken: string;
}

export interface RefreshTokenResponseDto {
  readonly token: string;
  readonly refreshToken: string;
  readonly expiresAtUtc: string;
}
