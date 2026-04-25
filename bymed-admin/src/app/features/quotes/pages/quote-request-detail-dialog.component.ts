import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { QuoteRequestDetailDto } from '@shared/models';

export interface QuoteRequestDetailDialogData {
  readonly quoteRequestId: string;
}

@Component({
  selector: 'app-quote-request-detail-dialog',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatDialogModule, MatProgressSpinnerModule],
  templateUrl: './quote-request-detail-dialog.component.html',
  styleUrls: ['./quote-request-detail-dialog.component.scss']
})
export class QuoteRequestDetailDialogComponent implements OnInit {
  private readonly data = inject<QuoteRequestDetailDialogData>(MAT_DIALOG_DATA);
  private readonly adminApi = inject(AdminApiService);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly detail = signal<QuoteRequestDetailDto | null>(null);

  public ngOnInit(): void {
    this.adminApi
      .getQuoteRequestById(this.data.quoteRequestId)
      .pipe(
        catchError((error: { message?: string }) => {
          this.errorMessage.set(error.message ?? 'Could not load this quote request.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((result) => this.detail.set(result));
  }
}
