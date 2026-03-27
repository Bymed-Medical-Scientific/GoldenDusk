import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { PageLoadingComponent } from '@shared/components/page-loading/page-loading.component';
import { OrderSummaryDto } from '@shared/models';
import { orderStatusChipClass, orderStatusLabel } from '@shared/utils/order-status';

type StatusFilter = 'all' | '0' | '1' | '2' | '3' | '4';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    NgClass,
    GlobalErrorComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    PageLoadingComponent,
    RouterLink
  ],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss'
})
export class OrderListComponent implements OnInit, AfterViewInit {
  private readonly adminApi = inject(AdminApiService);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly dateFrom = signal<string>('');
  protected readonly dateTo = signal<string>('');
  protected readonly dataSource = new MatTableDataSource<OrderSummaryDto>([]);
  protected readonly displayedColumns: string[] = [
    'orderNumber',
    'customer',
    'total',
    'status',
    'created',
    'actions'
  ];
  protected readonly totalCount = signal(0);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizeOptions = [10, 25, 50];

  protected readonly orderStatusLabel = orderStatusLabel;
  protected readonly orderStatusChipClass = orderStatusChipClass;

  @ViewChild(MatPaginator) private paginator?: MatPaginator;
  @ViewChild(MatSort) private sort?: MatSort;

  public ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (row, property) => {
      switch (property) {
        case 'orderNumber':
          return row.orderNumber;
        case 'customer':
          return row.customerName;
        case 'total':
          return row.total;
        case 'status':
          return row.status;
        case 'created':
          return new Date(row.creationTime).getTime();
        default:
          return '';
      }
    };

    this.loadPage();
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort ?? null;
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

  protected onPageChange(event: PageEvent): void {
    this.pageNumber.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
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
        this.dataSource.data = page.items;
        this.dataSource.sort = this.sort ?? null;

        if (this.paginator) {
          this.paginator.pageIndex = Math.max(page.pageNumber - 1, 0);
          this.paginator.pageSize = page.pageSize;
          this.paginator.length = page.totalCount;
        }
      });
  }
}
