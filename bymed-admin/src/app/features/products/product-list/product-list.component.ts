import { CurrencyPipe } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, EMPTY, finalize, forkJoin } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { PageLoadingComponent } from '@shared/components/page-loading/page-loading.component';
import { CategoryDto, ProductDto } from '@shared/models';

type AvailabilityFilter = 'all' | 'available' | 'unavailable';
type StockFilter = 'all' | 'in-stock' | 'out-of-stock' | 'low-stock';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    GlobalErrorComponent,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    PageLoadingComponent,
    RouterLink
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit, AfterViewInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly selectedCategoryId = signal<string>('all');
  protected readonly availabilityFilter = signal<AvailabilityFilter>('all');
  protected readonly stockFilter = signal<StockFilter>('all');
  protected readonly categories = signal<CategoryDto[]>([]);
  protected readonly dataSource = new MatTableDataSource<ProductDto>([]);
  protected readonly displayedColumns: string[] = [
    'name',
    'sku',
    'category',
    'price',
    'inventory',
    'availability',
    'actions'
  ];
  protected readonly deletingId = signal<string | null>(null);
  protected readonly totalCount = signal(0);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizeOptions = [10, 25, 50];

  @ViewChild(MatPaginator) private paginator?: MatPaginator;
  @ViewChild(MatSort) private sort?: MatSort;

  public ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (row, property) => {
      switch (property) {
        case 'name':
          return row.name;
        case 'sku':
          return row.sku ?? '';
        case 'category':
          return row.categoryName ?? this.resolveCategoryName(row.categoryId);
        case 'price':
          return row.price;
        case 'inventory':
          return row.inventoryCount;
        case 'availability':
          return row.isAvailable ? 1 : 0;
        default:
          return '';
      }
    };

    this.dataSource.filterPredicate = (row, filter) => {
      const parsed = JSON.parse(filter) as { q: string; stockFilter: StockFilter };
      const q = parsed.q.trim().toLowerCase();
      const categoryName = row.categoryName ?? this.resolveCategoryName(row.categoryId);
      const sku = row.sku ?? '';
      const matchesQuery =
        !q ||
        row.name.toLowerCase().includes(q) ||
        sku.toLowerCase().includes(q) ||
        categoryName.toLowerCase().includes(q);
      const matchesStock =
        parsed.stockFilter === 'all' ||
        (parsed.stockFilter === 'in-stock' && row.inventoryCount > 0) ||
        (parsed.stockFilter === 'out-of-stock' && row.inventoryCount <= 0) ||
        (parsed.stockFilter === 'low-stock' &&
          row.inventoryCount > 0 &&
          row.inventoryCount <= row.lowStockThreshold);
      return matchesQuery && matchesStock;
    };

    this.loadPage();
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort ?? null;
  }

  protected resolveCategoryName(categoryId: string): string {
    return this.categories().find((c) => c.id === categoryId)?.name ?? 'Uncategorized';
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.applyClientFilter();
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.applyClientFilter();
  }

  protected onCategoryChange(value: string): void {
    this.selectedCategoryId.set(value);
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected onAvailabilityChange(value: AvailabilityFilter): void {
    this.availabilityFilter.set(value);
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected onStockFilterChange(value: StockFilter): void {
    this.stockFilter.set(value);
    this.applyClientFilter();
  }

  protected onPageChange(event: PageEvent): void {
    this.pageNumber.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadPage();
  }

  protected deleteProduct(product: ProductDto): void {
    const data: ConfirmDialogData = {
      title: 'Delete product',
      message: `Delete "${product.name}"? This action deactivates the product from the catalog.`,
      confirmLabel: 'Delete',
      confirmColor: 'warn'
    };

    this.dialog
      .open(ConfirmDialogComponent, { data, width: 'min(440px, 92vw)' })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed !== true) {
          return;
        }

        this.deletingId.set(product.id);
        this.adminApi
          .deleteProduct(product.id)
          .pipe(
            catchError((err: unknown) => {
              const message = err instanceof ApiError ? err.message : 'Could not delete the product.';
              this.snackBar.open(message, 'Dismiss', { duration: 8000 });
              return EMPTY;
            }),
            finalize(() => this.deletingId.set(null))
          )
          .subscribe(() => {
            this.snackBar.open('Product deleted.', 'Dismiss', { duration: 4000 });
            this.loadPage();
          });
      });
  }

  private loadPage(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const categoryId = this.selectedCategoryId() === 'all' ? null : this.selectedCategoryId();
    const inStock =
      this.availabilityFilter() === 'all'
        ? null
        : this.availabilityFilter() === 'available';

    forkJoin({
      products: this.adminApi.getProducts(this.pageNumber(), this.pageSize(), {
        categoryId,
        search: this.searchQuery().trim() || null,
        inStock
      }),
      categories: this.adminApi.getCategories()
    })
      .pipe(
        catchError(() => {
          this.errorMessage.set('Products could not be loaded. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(({ products, categories }) => {
        this.categories.set(categories);
        this.totalCount.set(products.totalCount);
        this.pageNumber.set(products.pageNumber);
        this.pageSize.set(products.pageSize);
        this.dataSource.data = products.items;
        this.dataSource.sort = this.sort ?? null;
        this.applyClientFilter();

        if (this.paginator) {
          this.paginator.pageIndex = Math.max(products.pageNumber - 1, 0);
          this.paginator.pageSize = products.pageSize;
          this.paginator.length = products.totalCount;
        }
      });
  }

  private applyClientFilter(): void {
    this.dataSource.filter = JSON.stringify({
      q: this.searchQuery(),
      stockFilter: this.stockFilter()
    });
  }
}
