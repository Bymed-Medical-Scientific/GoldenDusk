import { Injectable } from '@angular/core';

const ACCESS_TOKEN_STORAGE_KEY = 'bymed.admin.access_token';

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

  public clearAccessToken(): void {
    sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }
}
