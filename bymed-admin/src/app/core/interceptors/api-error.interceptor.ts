import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { ApiProblemDetailsDto } from '@shared/models';
import { catchError, throwError } from 'rxjs';
import { ApiError, ApiValidationErrorItem } from '@core/api/api-error';
import { environment } from '../../../environments/environment';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const isDebugEnabled = environment.enableVerboseLogging;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => new ApiError(0, 'An unexpected client error occurred.'));
      }

      const problemDetails = parseProblemDetails(error);
      const parsedBody = parseBadRequestBody(error);
      const message =
        parsedBody.messageFromBody ??
        problemDetails?.detail ??
        problemDetails?.title ??
        error.message ??
        'Request failed.';

      if (isDebugEnabled) {
        console.error('API request failed', {
          url: request.url,
          method: request.method,
          status: error.status,
          message
        });
      }

      return throwError(
        () => new ApiError(error.status, message, problemDetails, parsedBody.validationErrors)
      );
    })
  );
};

function parseProblemDetails(error: HttpErrorResponse): ApiProblemDetailsDto | null {
  if (!error.error || typeof error.error !== 'object') {
    return null;
  }

  return error.error as ApiProblemDetailsDto;
}

function parseBadRequestBody(error: HttpErrorResponse): {
  readonly messageFromBody: string | null;
  readonly validationErrors: readonly ApiValidationErrorItem[] | undefined;
} {
  const body = error.error;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { messageFromBody: null, validationErrors: undefined };
  }

  const record = body as Record<string, unknown>;
  const errorText = record['error'];
  const messageFromError =
    typeof errorText === 'string' && errorText.length > 0 ? errorText : null;

  const rawErrors = record['errors'];
  let validationErrors: readonly ApiValidationErrorItem[] | undefined;
  if (Array.isArray(rawErrors)) {
    const items: ApiValidationErrorItem[] = [];
    for (const entry of rawErrors) {
      if (!entry || typeof entry !== 'object') {
        continue;
      }

      const row = entry as Record<string, unknown>;
      const propertyName = row['propertyName'];
      const errorMessage = row['errorMessage'];
      if (typeof propertyName === 'string' && typeof errorMessage === 'string') {
        items.push({ propertyName, errorMessage });
      }
    }

    if (items.length > 0) {
      validationErrors = items;
    }
  }

  let messageFromBody = messageFromError;
  if (!messageFromBody && validationErrors?.length) {
    messageFromBody = validationErrors.map((e) => e.errorMessage).join(' ');
  }

  return { messageFromBody, validationErrors };
}
