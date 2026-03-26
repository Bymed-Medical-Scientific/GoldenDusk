import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  public constructor(
    private readonly httpClient: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string
  ) {}

  public get<TResponse>(path: string, query?: Record<string, string | number | boolean | null | undefined>): Observable<TResponse> {
    return this.httpClient.get<TResponse>(this.buildUrl(path), { params: this.toHttpParams(query) });
  }

  public post<TRequest, TResponse>(path: string, payload: TRequest): Observable<TResponse> {
    return this.httpClient.post<TResponse>(this.buildUrl(path), payload);
  }

  public put<TRequest, TResponse>(path: string, payload: TRequest): Observable<TResponse> {
    return this.httpClient.put<TResponse>(this.buildUrl(path), payload);
  }

  public patch<TRequest, TResponse>(path: string, payload: TRequest): Observable<TResponse> {
    return this.httpClient.patch<TResponse>(this.buildUrl(path), payload);
  }

  public delete<TResponse>(path: string): Observable<TResponse> {
    return this.httpClient.delete<TResponse>(this.buildUrl(path));
  }

  private buildUrl(path: string): string {
    const normalizedBaseUrl = this.apiBaseUrl.replace(/\/+$/, '');
    const normalizedPath = path.replace(/^\/+/, '');
    return `${normalizedBaseUrl}/${normalizedPath}`;
  }

  private toHttpParams(query?: Record<string, string | number | boolean | null | undefined>): HttpParams {
    if (!query) {
      return new HttpParams();
    }

    return Object.entries(query).reduce((params, [key, value]) => {
      if (value === undefined || value === null) {
        return params;
      }

      return params.set(key, String(value));
    }, new HttpParams());
  }
}
