import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '@core/api/api.service';
import {
  AdminRegisterOutcome,
  LoginRequestDto,
  LoginResponseDto,
  RefreshTokenRequestDto,
  RefreshTokenResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
  ResetPasswordRequestDto
} from '@shared/models';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
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
      .post<LoginRequestDto, LoginResponseDto>('auth/login', request)
      .pipe(tap((response) => this.persistLogin(response)));
  }

  /** Persists access/refresh tokens and user (e.g. after login or bootstrap register). */
  public setSession(response: LoginResponseDto): void {
    this.persistLogin(response);
  }

  /**
   * Admin SPA sign-up: uses `AdminPanel` channel. Returns a session only when the account is active
   * (e.g. first bootstrap admin); otherwise approval is required first.
   */
  public registerAdmin(request: Omit<RegisterRequestDto, 'registrationChannel'>): Observable<AdminRegisterOutcome> {
    const body: RegisterRequestDto = {
      ...request,
      registrationChannel: 'AdminPanel'
    };

    return this.apiService.postWithResponse<RegisterRequestDto, RegisterResponseDto>('auth/register', body).pipe(
      map((res) => {
        const payload = res.body;
        if (!payload) {
          throw new Error('Empty response from server.');
        }

        const pending =
          res.status === 202 ||
          payload.pendingAdminApproval === true ||
          !payload.token ||
          !payload.refreshToken;

        if (pending) {
          return { kind: 'pendingApproval' as const };
        }

        const login: LoginResponseDto = {
          user: payload.user,
          token: payload.token!,
          refreshToken: payload.refreshToken!
        };

        return { kind: 'session' as const, login };
      })
    );
  }

  public logout(): Observable<void> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      this.tokenStorage.clearSession();
      void this.router.navigate(['/login']);
      return of(void 0);
    }

    return this.apiService.postNoContent('auth/logout', { refreshToken }).pipe(
      catchError(() => of(void 0)),
      finalize(() => {
        this.tokenStorage.clearSession();
        void this.router.navigate(['/login']);
      }),
      map(() => void 0)
    );
  }

  /** Sends a password reset link to the email (API always returns 204 for privacy). */
  public requestPasswordReset(body: ResetPasswordRequestDto): Observable<void> {
    return this.apiService.postNoContent('auth/reset-password', body);
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
      .post<RefreshTokenRequestDto, RefreshTokenResponseDto>('auth/refresh', { refreshToken })
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
