import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { OrderSummaryDto } from '@shared/models';
import { orderStatusChipClass, orderStatusLabel } from '@shared/utils/order-status';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';

type StatusFilter = 'all' | '0' | '1' | '2' | '3' | '4';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    ButtonModule,
    CurrencyPipe,
    DatePipe,
    FormsModule,
    NgClass,
    GlobalErrorComponent,
    InputTextModule,
    PaginatorModule,
    ProgressBarModule,
    SelectModule,
    TableModule,
    TableSkeletonComponent,
    RouterLink
  ],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss'
})
export class OrderListComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  protected readonly isLoading = signal(true);
  protected readonly isExporting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pageMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly dateFrom = signal<string>('');
  protected readonly dateTo = signal<string>('');
  protected readonly items = signal<OrderSummaryDto[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizeOptions = [10, 25, 50];
  protected readonly statusOptions: Array<{ label: string; value: StatusFilter }> = [
    { label: 'All statuses', value: 'all' },
    { label: 'Pending', value: '0' },
    { label: 'Processing', value: '1' },
    { label: 'Shipped', value: '2' },
    { label: 'Delivered', value: '3' },
    { label: 'Cancelled', value: '4' }
  ];

  protected readonly orderStatusLabel = orderStatusLabel;
  protected readonly orderStatusChipClass = orderStatusChipClass;

  public ngOnInit(): void {
    this.loadPage();
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected onStatusChange(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected onDateFromChange(value: string): void {
    this.dateFrom.set(value ?? '');
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected onDateToChange(value: string): void {
    this.dateTo.set(value ?? '');
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected exportToCsv(): void {
    const parsedStatus =
      this.statusFilter() === 'all' ? null : Number.parseInt(this.statusFilter(), 10);
    const statusParam =
      parsedStatus === null || Number.isNaN(parsedStatus) ? null : parsedStatus;
    const dateFrom = this.dateFrom().trim() || null;
    const dateTo = this.dateTo().trim() || null;
    const search = this.searchQuery().trim() || null;

    this.isExporting.set(true);
    this.adminApi
      .exportOrders({
        status: statusParam,
        dateFrom,
        dateTo,
        search
      })
      .pipe(
        catchError((err: unknown) => {
          const message = err instanceof ApiError ? err.message : 'Could not export orders.';
          this.pageMessage.set(message);
          return EMPTY;
        }),
        finalize(() => this.isExporting.set(false))
      )
      .subscribe((blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
        this.pageMessage.set('Export completed.');
      });
  }

  protected onPageChange(event: PaginatorState): void {
    this.pageNumber.set((event.page ?? 0) + 1);
    this.pageSize.set(event.rows ?? this.pageSize());
    this.loadPage();
  }

  private loadPage(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const parsedStatus =
      this.statusFilter() === 'all' ? null : Number.parseInt(this.statusFilter(), 10);
    const statusParam =
      parsedStatus === null || Number.isNaN(parsedStatus) ? null : parsedStatus;
    const dateFrom = this.dateFrom().trim() || null;
    const dateTo = this.dateTo().trim() || null;
    const search = this.searchQuery().trim() || null;

    this.adminApi
      .getOrders(this.pageNumber(), this.pageSize(), {
        status: statusParam,
        dateFrom,
        dateTo,
        search
      })
      .pipe(
        catchError(() => {
          this.errorMessage.set('Orders could not be loaded. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((page) => {
        this.totalCount.set(page.totalCount);
        this.pageNumber.set(page.pageNumber);
        this.pageSize.set(page.pageSize);
        this.items.set(page.items);
      });
  }
}
