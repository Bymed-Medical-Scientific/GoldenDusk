import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { OrderSummaryDto } from '@shared/models';
import { orderStatusLabel } from '@shared/utils/order-status';
import { TablePaginationComponent, TablePageChange } from '@shared/components/table-pagination/table-pagination.component';
import { ProgressBarModule } from 'primeng/progressbar';

type StatusFilter = 'all' | '0' | '1' | '2' | '3' | '4';

interface StatusTab {
  readonly label: string;
  readonly value: StatusFilter;
}

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    NgClass,
    GlobalErrorComponent,
    TablePaginationComponent,
    ProgressBarModule,
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
  protected readonly items = signal<OrderSummaryDto[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizeOptions = [10, 25, 50];
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  protected readonly statusTabs: readonly StatusTab[] = [
    { label: 'All', value: 'all' },
    { label: 'Completed', value: '3' },
    { label: 'Processing', value: '1' },
    { label: 'Pending', value: '0' },
    { label: 'Cancelled', value: '4' }
  ];
  protected readonly allSelected = computed(() => {
    const rows = this.items();
    const selected = this.selectedIds();
    return rows.length > 0 && rows.every((row) => selected.has(row.id));
  });
  protected readonly orderStatusLabel = orderStatusLabel;

  public ngOnInit(): void {
    this.loadPage();
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.pageNumber.set(1);
    this.selectedIds.set(new Set());
    this.loadPage();
  }

  protected clearSearch(): void {
    this.onSearchChange('');
  }

  protected onStatusTabChange(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.pageNumber.set(1);
    this.selectedIds.set(new Set());
    this.loadPage();
  }

  protected toggleSelectAll(checked: boolean): void {
    if (!checked) {
      this.selectedIds.set(new Set());
      return;
    }

    this.selectedIds.set(new Set(this.items().map((row) => row.id)));
  }

  protected toggleRowSelection(rowId: string, checked: boolean): void {
    const next = new Set(this.selectedIds());
    if (checked) {
      next.add(rowId);
    } else {
      next.delete(rowId);
    }
    this.selectedIds.set(next);
  }

  protected isRowSelected(rowId: string): boolean {
    return this.selectedIds().has(rowId);
  }

  protected exportToCsv(): void {
    const parsedStatus = this.statusFilter() === 'all' ? null : Number.parseInt(this.statusFilter(), 10);
    const statusParam = parsedStatus === null || Number.isNaN(parsedStatus) ? null : parsedStatus;
    const search = this.searchQuery().trim() || null;

    this.isExporting.set(true);
    this.adminApi
      .exportOrders({
        status: statusParam,
        dateFrom: null,
        dateTo: null,
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

  protected onPageChange(event: TablePageChange): void {
    this.pageNumber.set(event.pageNumber);
    this.pageSize.set(event.pageSize);
    this.selectedIds.set(new Set());
    this.loadPage();
  }

  protected customerInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '?';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  protected primaryProduct(row: OrderSummaryDto): string {
    if (row.items.length === 0) {
      return '—';
    }
    if (row.items.length === 1) {
      return row.items[0].productName;
    }
    return `${row.items[0].productName} +${row.items.length - 1} more`;
  }

  protected statusBadgeClass(status: number): string {
    switch (status) {
      case 3:
        return 'status-completed';
      case 1:
        return 'status-processing';
      case 0:
        return 'status-pending';
      case 4:
        return 'status-cancelled';
      case 2:
        return 'status-shipped';
      default:
        return 'status-default';
    }
  }

  protected sparklinePath(status: number): string {
    const positive = [4, 12, 8, 16, 10, 18, 14, 22];
    const negative = [22, 18, 16, 14, 12, 10, 8, 4];
    const flat = [12, 12, 13, 12, 13, 12, 13, 12];
    const values = status === 4 ? negative : status === 0 ? flat : positive;
    const width = 64;
    const height = 24;
    const max = Math.max(...values, 1);
    const step = width / (values.length - 1);

    return values
      .map((value, index) => {
        const x = index * step;
        const y = height - (value / max) * (height - 4) - 2;
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  protected sparklineClass(status: number): string {
    if (status === 4) {
      return 'sparkline-down';
    }
    if (status === 0) {
      return 'sparkline-flat';
    }
    return 'sparkline-up';
  }

  private loadPage(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const parsedStatus = this.statusFilter() === 'all' ? null : Number.parseInt(this.statusFilter(), 10);
    const statusParam = parsedStatus === null || Number.isNaN(parsedStatus) ? null : parsedStatus;
    const search = this.searchQuery().trim() || null;

    this.adminApi
      .getOrders(this.pageNumber(), this.pageSize(), {
        status: statusParam,
        dateFrom: null,
        dateTo: null,
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
