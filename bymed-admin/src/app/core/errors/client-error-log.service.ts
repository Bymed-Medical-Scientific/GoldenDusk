import { HttpBackend, HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { AuthTokenStorageService } from '@core/auth/auth-token-storage.service';
import { Observable, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface AdminClientErrorPayload {
  readonly message: string;
  readonly stackTrace?: string | null;
  readonly pageUrl?: string | null;
  readonly componentName?: string | null;
}

/**
 * Posts client error reports to the API using HttpBackend so interceptors (and recursive errors) are avoided.
 */
@Injectable({
  providedIn: 'root'
})
export class ClientErrorLogService {
  private readonly rawHttp = new HttpClient(inject(HttpBackend));
  private readonly tokenStorage = inject(AuthTokenStorageService);

  public constructor(@Inject(API_BASE_URL) private readonly apiBaseUrl: string) {}

  /** Fire-and-forget safe: completes with EMPTY when unauthenticated or on failure. */
  public report(payload: AdminClientErrorPayload): Observable<void> {
    const token = this.tokenStorage.getAccessToken();
    if (!token) {
      return EMPTY;
    }

    const url = `${this.apiBaseUrl.replace(/\/+$/, '')}/v1.0/admin/client-errors`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });

    return this.rawHttp.post<void>(url, payload, { headers }).pipe(catchError(() => EMPTY));
  }
}
