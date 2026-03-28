import { NgClass } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { InventoryItemDto } from '@shared/models';

type StockScopeFilter = 'all' | 'low';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    FormsModule,
    GlobalErrorComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    NgClass,
    TableSkeletonComponent,
    RouterLink
  ],
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.scss'
})
export class InventoryListComponent implements OnInit, AfterViewInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly stockScope = signal<StockScopeFilter>('all');
  protected readonly dataSource = new MatTableDataSource<InventoryItemDto>([]);
  protected readonly displayedColumns: string[] = [
    'productName',
    'sku',
    'inventoryCount',
    'lowStockThreshold',
    'availability',
    'stockStatus',
    'actions'
  ];
  protected readonly totalCount = signal(0);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizeOptions = [10, 25, 50];

  @ViewChild(MatPaginator) private paginator?: MatPaginator;
  @ViewChild(MatSort) private sort?: MatSort;

  public ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (row, property) => {
      switch (property) {
        case 'productName':
          return row.productName;
        case 'sku':
          return row.sku ?? '';
        case 'inventoryCount':
          return row.inventoryCount;
        case 'lowStockThreshold':
          return row.lowStockThreshold;
        case 'availability':
          return row.isAvailable ? 1 : 0;
        case 'stockStatus':
          return row.isLowStock ? 0 : 1;
        default:
          return '';
      }
    };

    const low = this.route.snapshot.queryParamMap.get('lowStock');
    if (low === '1' || low?.toLowerCase() === 'true') {
      this.stockScope.set('low');
    }

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

  protected onStockScopeChange(value: StockScopeFilter): void {
    this.stockScope.set(value);
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.stockScope.set('all');
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

    const search = this.searchQuery().trim() || null;
    const lowStockOnly = this.stockScope() === 'low';

    this.adminApi
      .getInventory(this.pageNumber(), this.pageSize(), {
        lowStockOnly,
        search
      })
      .pipe(
        catchError(() => {
          this.errorMessage.set('Inventory could not be loaded. Please try again.');
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
