import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError, timer } from 'rxjs';
import { retry } from 'rxjs/operators';

const TransientStatuses = new Set([502, 503, 504]);

const RetryableMethods = new Set(['GET', 'HEAD']);

/**
 * Retries idempotent requests when the server returns a transient gateway / availability error.
 */
export const httpRetryInterceptor: HttpInterceptorFn = (request, next) => {
  if (!RetryableMethods.has(request.method)) {
    return next(request);
  }

  return next(request).pipe(
    retry({
      count: 2,
      delay: (error, retryCount) => {
        if (!(error instanceof HttpErrorResponse) || !TransientStatuses.has(error.status)) {
          return throwError(() => error);
        }

        return timer(250 * retryCount);
      }
    })
  );
};
