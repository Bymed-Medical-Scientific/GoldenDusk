import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { PagedResultDto, QuotationSummaryDto } from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';

type QuotationStatusFilter = 'all' | '0' | '1' | '2';
type PoOutcomeFilter = 'all' | 'yes' | 'no';

@Component({
  selector: 'app-quotations-page',
  standalone: true,
  imports: [
    ButtonModule,
    CurrencyPipe,
    DatePipe,
    FormsModule,
    GlobalErrorComponent,
    InputTextModule,
    PaginatorModule,
    RouterLink,
    SelectModule,
    TableModule
  ],
  templateUrl: './quotations-page.component.html',
  styleUrl: './quotations-page.component.scss'
})
export class QuotationsPageComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  protected readonly isLoading = signal(true);
  protected readonly isUpdatingPo = signal<string | null>(null);
  protected readonly isExportingPdf = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pageMessage = signal<string | null>(null);
  protected readonly items = signal<QuotationSummaryDto[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<QuotationStatusFilter>('all');
  protected readonly poOutcomeFilter = signal<PoOutcomeFilter>('all');
  protected readonly totalCount = signal(0);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizeOptions = [10, 25, 50];
  protected readonly statusOptions: Array<{ label: string; value: QuotationStatusFilter }> = [
    { label: 'All statuses', value: 'all' },
    { label: 'Draft', value: '0' },
    { label: 'Finalized', value: '1' },
    { label: 'Cancelled', value: '2' }
  ];
  protected readonly poOptions: Array<{ label: string; value: PoOutcomeFilter }> = [
    { label: 'All PO outcomes', value: 'all' },
    { label: 'With purchase order', value: 'yes' },
    { label: 'Without purchase order', value: 'no' }
  ];

  public ngOnInit(): void {
    this.loadPage();
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected onStatusChange(value: QuotationStatusFilter): void {
    this.statusFilter.set(value);
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected onPoFilterChange(value: PoOutcomeFilter): void {
    this.poOutcomeFilter.set(value);
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.poOutcomeFilter.set('all');
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected onPageChange(event: PaginatorState): void {
    this.pageNumber.set((event.page ?? 0) + 1);
    this.pageSize.set(event.rows ?? this.pageSize());
    this.loadPage();
  }

  protected statusLabel(status: number): string {
    if (status === 0) return 'Draft';
    if (status === 1) return 'Finalized';
    if (status === 2) return 'Cancelled';
    return 'Unknown';
  }

  protected canUpdatePurchaseOrder(row: QuotationSummaryDto): boolean {
    return row.status === 1;
  }

  protected togglePurchaseOrder(row: QuotationSummaryDto, hasPo: boolean): void {
    if (!this.canUpdatePurchaseOrder(row)) {
      return;
    }

    const reference = hasPo
      ? window.prompt('Enter purchase order reference:', row.purchaseOrderReference ?? '')
      : '';

    if (hasPo && (!reference || reference.trim().length === 0)) {
      this.pageMessage.set('Purchase order reference is required.');
      return;
    }

    this.isUpdatingPo.set(row.id);
    this.pageMessage.set(null);
    this.adminApi
      .updateQuotationPurchaseOrder(row.id, {
        hasPurchaseOrder: hasPo,
        purchaseOrderReference: hasPo ? reference!.trim() : null
      })
      .pipe(
        catchError((error: unknown) => {
          const message = error instanceof ApiError ? error.message : 'Could not update purchase order outcome.';
          this.pageMessage.set(message);
          return EMPTY;
        }),
        finalize(() => this.isUpdatingPo.set(null))
      )
      .subscribe(() => {
        this.pageMessage.set('Purchase order outcome updated.');
        this.loadPage();
      });
  }

  protected exportPdf(row: QuotationSummaryDto): void {
    this.isExportingPdf.set(row.id);
    this.pageMessage.set(null);
    this.adminApi
      .exportQuotationPdf(row.id)
      .pipe(
        catchError((error: unknown) => {
          this.pageMessage.set(error instanceof ApiError ? error.message : 'Could not export quotation PDF.');
          return EMPTY;
        }),
        finalize(() => this.isExportingPdf.set(null))
      )
      .subscribe((blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${row.quotationNumber}.pdf`;
        anchor.click();
        URL.revokeObjectURL(url);
      });
  }

  private loadPage(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const parsedStatus =
      this.statusFilter() === 'all' ? null : Number.parseInt(this.statusFilter(), 10);
    const status = parsedStatus === null || Number.isNaN(parsedStatus) ? null : parsedStatus;
    const hasPurchaseOrder =
      this.poOutcomeFilter() === 'all' ? null : this.poOutcomeFilter() === 'yes';

    this.adminApi
      .getQuotations(this.pageNumber(), this.pageSize(), {
        status,
        hasPurchaseOrder,
        search: this.searchQuery().trim() || null
      })
      .pipe(
        catchError(() => {
          this.errorMessage.set('Quotations could not be loaded. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((result: PagedResultDto<QuotationSummaryDto>) => {
        this.items.set(result.items);
        this.totalCount.set(result.totalCount);
        this.pageNumber.set(result.pageNumber);
        this.pageSize.set(result.pageSize);
      });
  }
}
