import { ErrorHandler, Injectable, NgZone, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClientErrorLogService } from './client-error-log.service';
import { getAdminFriendlyErrorMessage } from './admin-friendly-error-message';
import { environment } from '../../../environments/environment';

@Injectable()
export class GlobalAdminErrorHandler implements ErrorHandler {
  private readonly snackBar = inject(MatSnackBar);
  private readonly zone = inject(NgZone);
  private readonly clientLog = inject(ClientErrorLogService);

  public handleError(error: unknown): void {
    const err = error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Unknown error');

    if (environment.enableVerboseLogging) {
      console.error(err);
    } else {
      console.error(err.message);
    }

    const stackTrace = err.stack ?? null;
    const pageUrl = typeof globalThis.location !== 'undefined' ? globalThis.location.href : null;

    this.clientLog
      .report({
        message: err.message || 'Unknown error',
        stackTrace,
        pageUrl,
        componentName: null
      })
      .subscribe();

    const userMessage = getAdminFriendlyErrorMessage(error);

    this.zone.run(() => {
      const ref = this.snackBar.open(userMessage, 'Reload', {
        duration: 12_000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['admin-error-snackbar']
      });
      ref.onAction().subscribe(() => globalThis.location.reload());
    });
  }
}
