import { Injectable } from '@angular/core';
import { AuthUserDto } from '@shared/models';

const ACCESS_TOKEN_STORAGE_KEY = 'bymed.admin.access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'bymed.admin.refresh_token';
const AUTH_USER_STORAGE_KEY = 'bymed.admin.user';

@Injectable({
  providedIn: 'root'
})
export class AuthTokenStorageService {
  public getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  }

  public setAccessToken(token: string): void {
    sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  }

  public getRefreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  }

  public setRefreshToken(token: string): void {
    sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
  }

  public getUser(): AuthUserDto | null {
    const rawValue = sessionStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as AuthUserDto;
    } catch {
      return null;
    }
  }

  public setUser(user: AuthUserDto): void {
    sessionStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  }

  public clearAccessToken(): void {
    sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }

  public clearSession(): void {
    sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
  }
}
