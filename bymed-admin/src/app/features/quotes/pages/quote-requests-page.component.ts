import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { PagedResultDto, QuoteRequestSummaryDto } from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { QuoteRequestDetailDialogComponent } from './quote-request-detail-dialog.component';

@Component({
  selector: 'app-quote-requests-page',
  standalone: true,
  imports: [DatePipe, FormsModule, ButtonModule, ProgressSpinnerModule, MatDialogModule],
  templateUrl: './quote-requests-page.component.html',
  styleUrls: ['./quote-requests-page.component.scss']
})
export class QuoteRequestsPageComponent implements OnInit {
  protected readonly isLoading = signal(true);
  protected readonly rows = signal<QuoteRequestSummaryDto[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly totalCount = signal(0);
  protected fullNameFilter = '';
  protected institutionFilter = '';
  protected emailFilter = '';
  protected phoneFilter = '';
  protected dateFromFilter = '';
  protected dateToFilter = '';

  public constructor(
    private readonly adminApi: AdminApiService,
    private readonly dialog: MatDialog
  ) {}

  public ngOnInit(): void {
    this.load();
  }

  protected refresh(): void {
    this.load();
  }

  protected applyFilters(): void {
    this.pageNumber.set(1);
    this.load();
  }

  protected clearFilters(): void {
    this.fullNameFilter = '';
    this.institutionFilter = '';
    this.emailFilter = '';
    this.phoneFilter = '';
    this.dateFromFilter = '';
    this.dateToFilter = '';
    this.pageNumber.set(1);
    this.load();
  }

  protected nextPage(): void {
    if (this.pageNumber() * this.pageSize() >= this.totalCount()) {
      return;
    }

    this.pageNumber.update((value) => value + 1);
    this.load();
  }

  protected previousPage(): void {
    if (this.pageNumber() <= 1) {
      return;
    }

    this.pageNumber.update((value) => value - 1);
    this.load();
  }

  protected hasPrevious(): boolean {
    return this.pageNumber() > 1;
  }

  protected hasNext(): boolean {
    return this.pageNumber() * this.pageSize() < this.totalCount();
  }

  protected totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize()));
  }

  protected openDetails(row: QuoteRequestSummaryDto): void {
    this.dialog.open(QuoteRequestDetailDialogComponent, {
      width: '920px',
      maxWidth: '96vw',
      data: { quoteRequestId: row.id }
    });
  }

  private load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.adminApi
      .getQuoteRequests(this.pageNumber(), this.pageSize(), {
        fullName: this.fullNameFilter,
        institution: this.institutionFilter,
        email: this.emailFilter,
        phoneNumber: this.phoneFilter,
        dateFromUtc: this.toUtcIsoStart(this.dateFromFilter),
        dateToUtc: this.toUtcIsoEnd(this.dateToFilter)
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (result: PagedResultDto<QuoteRequestSummaryDto>) => {
          this.rows.set(result.items);
          this.totalCount.set(result.totalCount);
        },
        error: (error: { message?: string }) => {
          this.rows.set([]);
          this.errorMessage.set(error.message ?? 'Failed to load quote requests.');
        }
      });
  }

  private toUtcIsoStart(value: string): string | null {
    if (!value?.trim()) {
      return null;
    }

    const localDate = new Date(`${value}T00:00:00`);
    return Number.isNaN(localDate.getTime()) ? null : localDate.toISOString();
  }

  private toUtcIsoEnd(value: string): string | null {
    if (!value?.trim()) {
      return null;
    }

    const localDate = new Date(`${value}T23:59:59.999`);
    return Number.isNaN(localDate.getTime()) ? null : localDate.toISOString();
  }
}
