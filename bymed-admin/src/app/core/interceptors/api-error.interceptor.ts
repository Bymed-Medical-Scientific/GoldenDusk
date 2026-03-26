import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { ApiProblemDetailsDto } from '@shared/models';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '@core/api/api-error';
import { environment } from '../../../environments/environment';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const isDebugEnabled = environment.enableVerboseLogging;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => new ApiError(0, 'An unexpected client error occurred.'));
      }

      const problemDetails = parseProblemDetails(error);
      const message = problemDetails?.detail ?? problemDetails?.title ?? error.message ?? 'Request failed.';

      if (isDebugEnabled) {
        console.error('API request failed', {
          url: request.url,
          method: request.method,
          status: error.status,
          message
        });
      }

      return throwError(() => new ApiError(error.status, message, problemDetails));
    })
  );
};

function parseProblemDetails(error: HttpErrorResponse): ApiProblemDetailsDto | null {
  if (!error.error || typeof error.error !== 'object') {
    return null;
  }

  return error.error as ApiProblemDetailsDto;
}
