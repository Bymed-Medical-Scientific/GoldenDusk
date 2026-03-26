export interface LoginRequestDto {
  readonly email: string;
  readonly password: string;
}

export interface AuthUserDto {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: 'Customer' | 'Admin' | string;
}

export interface LoginResponseDto {
  readonly user: AuthUserDto;
  readonly token: string;
  readonly refreshToken: string;
}

export interface RefreshTokenRequestDto {
  readonly refreshToken: string;
}

export interface RefreshTokenResponseDto {
  readonly token: string;
  readonly refreshToken: string;
}
