import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TablePaginationComponent, TablePageChange } from '@shared/components/table-pagination/table-pagination.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { QuoteRequestSummaryDto } from '@shared/models';
import { QuoteRequestDetailDialogComponent } from './quote-request-detail-dialog.component';

@Component({
  selector: 'app-quote-requests-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatDialogModule,
    GlobalErrorComponent,
    TablePaginationComponent,
    TableSkeletonComponent
  ],
  templateUrl: './quote-requests-page.component.html',
  styleUrl: './quote-requests-page.component.scss'
})
export class QuoteRequestsPageComponent implements OnInit {
  protected readonly isLoading = signal(true);
  protected readonly rows = signal<QuoteRequestSummaryDto[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly totalCount = signal(0);
  protected readonly pageSizeOptions = [10, 20, 50];
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

  protected onPageChange(event: TablePageChange): void {
    this.pageNumber.set(event.pageNumber);
    this.pageSize.set(event.pageSize);
    this.load();
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
      .pipe(
        catchError(() => {
          this.errorMessage.set('Quote requests could not be loaded. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((result) => {
        this.rows.set(result.items);
        this.totalCount.set(result.totalCount);
        this.pageNumber.set(result.pageNumber);
        this.pageSize.set(result.pageSize);
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
