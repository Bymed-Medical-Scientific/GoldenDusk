import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '@core/api/api.service';
import {
  LoginRequestDto,
  LoginResponseDto,
  RefreshTokenRequestDto,
  RefreshTokenResponseDto
} from '@shared/models';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { AuthTokenStorageService } from './auth-token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public constructor(
    private readonly apiService: ApiService,
    private readonly tokenStorage: AuthTokenStorageService,
    private readonly router: Router
  ) {}

  public login(request: LoginRequestDto): Observable<LoginResponseDto> {
    return this.apiService
      .post<LoginRequestDto, LoginResponseDto>('v1/auth/login', request)
      .pipe(tap((response) => this.persistLogin(response)));
  }

  public logout(): Observable<void> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      this.tokenStorage.clearSession();
      void this.router.navigate(['/login']);
      return of(void 0);
    }

    return this.apiService
      .post<RefreshTokenRequestDto, void>('v1/auth/logout', { refreshToken })
      .pipe(
        catchError(() => of(void 0)),
        tap(() => {
          this.tokenStorage.clearSession();
          void this.router.navigate(['/login']);
        }),
        map(() => void 0)
      );
  }

  public isAuthenticated(): boolean {
    return Boolean(this.tokenStorage.getAccessToken());
  }

  public isAdmin(): boolean {
    const role = this.tokenStorage.getUser()?.role;
    // API may send enum as string ("Admin") or legacy numeric JSON (1 = Admin).
    if (role === 'Admin' || role === 1) {
      return true;
    }
    return typeof role === 'string' && role.toLowerCase() === 'admin';
  }

  public refreshToken(): Observable<RefreshTokenResponseDto> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('Missing refresh token.');
    }

    return this.apiService
      .post<RefreshTokenRequestDto, RefreshTokenResponseDto>('v1/auth/refresh', { refreshToken })
      .pipe(
        tap((response) => {
          this.tokenStorage.setAccessToken(response.token);
          this.tokenStorage.setRefreshToken(response.refreshToken);
        })
      );
  }

  private persistLogin(response: LoginResponseDto): void {
    this.tokenStorage.setAccessToken(response.token);
    this.tokenStorage.setRefreshToken(response.refreshToken);
    this.tokenStorage.setUser(response.user);
  }
}
