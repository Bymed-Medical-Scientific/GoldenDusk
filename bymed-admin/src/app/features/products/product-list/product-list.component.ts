import { HttpEventType, HttpResponse } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, EMPTY, filter, finalize, forkJoin, map, tap } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { CategoryDto, ImportProductsResultDto, ProductDto } from '@shared/models';

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
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    TableSkeletonComponent,
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
    'select',
    'name',
    'sku',
    'category',
    'price',
    'inventory',
    'availability',
    'actions'
  ];
  protected readonly deletingId = signal<string | null>(null);
  protected readonly isBulkProcessing = signal(false);
  protected readonly importUploadProgress = signal<number | null>(null);
  protected readonly selectedProductIds = signal<Set<string>>(new Set<string>());
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

  protected isSelected(productId: string): boolean {
    return this.selectedProductIds().has(productId);
  }

  protected isAllRowsSelected(): boolean {
    const rows = this.dataSource.filteredData;
    if (rows.length === 0) {
      return false;
    }

    const selected = this.selectedProductIds();
    return rows.every((row) => selected.has(row.id));
  }

  protected toggleRowSelection(productId: string, checked: boolean): void {
    const current = new Set(this.selectedProductIds());
    if (checked) {
      current.add(productId);
    } else {
      current.delete(productId);
    }

    this.selectedProductIds.set(current);
  }

  protected toggleAllRowsSelection(checked: boolean): void {
    if (!checked) {
      this.selectedProductIds.set(new Set<string>());
      return;
    }

    const allIds = this.dataSource.filteredData.map((row) => row.id);
    this.selectedProductIds.set(new Set(allIds));
  }

  protected clearSelection(): void {
    this.selectedProductIds.set(new Set<string>());
  }

  protected bulkDeleteSelected(): void {
    const selectedIds = Array.from(this.selectedProductIds());
    if (selectedIds.length === 0) {
      this.snackBar.open('Select at least one product.', 'Dismiss', { duration: 4000 });
      return;
    }

    const data: ConfirmDialogData = {
      title: 'Bulk delete products',
      message: `Delete ${selectedIds.length} selected product(s)? This action deactivates them from the catalog.`,
      confirmLabel: 'Delete all',
      confirmColor: 'warn'
    };

    this.dialog
      .open(ConfirmDialogComponent, { data, width: 'min(480px, 92vw)' })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed !== true) {
          return;
        }

        this.isBulkProcessing.set(true);
        this.adminApi
          .bulkDeleteProducts({ productIds: selectedIds })
          .pipe(
            catchError((err: unknown) => {
              const message = err instanceof ApiError ? err.message : 'Could not bulk delete products.';
              this.snackBar.open(message, 'Dismiss', { duration: 8000 });
              return EMPTY;
            }),
            finalize(() => this.isBulkProcessing.set(false))
          )
          .subscribe((result) => {
            this.snackBar.open(
              `Processed ${result.processedCount}/${result.requestedCount} product(s).`,
              'Dismiss',
              { duration: 5000 }
            );
            this.clearSelection();
            this.loadPage();
          });
      });
  }

  protected bulkSetAvailability(isAvailable: boolean): void {
    const selectedIds = Array.from(this.selectedProductIds());
    if (selectedIds.length === 0) {
      this.snackBar.open('Select at least one product.', 'Dismiss', { duration: 4000 });
      return;
    }

    const count = selectedIds.length;
    const data: ConfirmDialogData = isAvailable
      ? {
          title: 'Mark products as available?',
          message: `Mark ${count} selected product(s) as available? Visible to customers when in stock and inventory rules allow.`,
          confirmLabel: 'Mark available',
          confirmColor: 'primary'
        }
      : {
          title: 'Mark products as unavailable?',
          message: `Mark ${count} selected product(s) as unavailable? They will be hidden from the catalog.`,
          confirmLabel: 'Mark unavailable',
          confirmColor: 'warn'
        };

    this.dialog
      .open(ConfirmDialogComponent, { data, width: 'min(480px, 92vw)' })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed !== true) {
          return;
        }

        this.isBulkProcessing.set(true);
        this.adminApi
          .bulkSetProductAvailability({ productIds: selectedIds, isAvailable })
          .pipe(
            catchError((err: unknown) => {
              const message = err instanceof ApiError ? err.message : 'Could not update availability.';
              this.snackBar.open(message, 'Dismiss', { duration: 8000 });
              return EMPTY;
            }),
            finalize(() => this.isBulkProcessing.set(false))
          )
          .subscribe((result) => {
            const label = isAvailable ? 'available' : 'unavailable';
            this.snackBar.open(
              `Marked ${result.processedCount}/${result.requestedCount} product(s) as ${label}.`,
              'Dismiss',
              { duration: 5000 }
            );
            this.clearSelection();
            this.loadPage();
          });
      });
  }

  protected exportSelected(): void {
    const selectedIds = Array.from(this.selectedProductIds());

    this.adminApi
      .exportProducts(selectedIds.length > 0 ? selectedIds : undefined)
      .pipe(
        catchError((err: unknown) => {
          const message = err instanceof ApiError ? err.message : 'Could not export products.';
          this.snackBar.open(message, 'Dismiss', { duration: 8000 });
          return EMPTY;
        })
      )
      .subscribe((blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'products-export.csv';
        anchor.click();
        URL.revokeObjectURL(url);

        this.snackBar.open('Export completed.', 'Dismiss', { duration: 3500 });
      });
  }

  protected importProducts(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    this.isBulkProcessing.set(true);
    this.importUploadProgress.set(0);
    this.adminApi
      .importProductsWithProgress(file)
      .pipe(
        tap((event) => {
          if (event.type === HttpEventType.UploadProgress && event.total && event.total > 0) {
            this.importUploadProgress.set(Math.round((100 * event.loaded) / event.total));
          }
        }),
        filter((e): e is HttpResponse<ImportProductsResultDto> => e.type === HttpEventType.Response),
        map((e) => e.body!),
        catchError((err: unknown) => {
          const message = err instanceof ApiError ? err.message : 'Could not import products.';
          this.snackBar.open(message, 'Dismiss', { duration: 8000 });
          return EMPTY;
        }),
        finalize(() => {
          this.isBulkProcessing.set(false);
          this.importUploadProgress.set(null);
          if (input) {
            input.value = '';
          }
        })
      )
      .subscribe((result) => {
        this.snackBar.open(
          `Import complete: ${result.importedCount} added, ${result.updatedCount} updated, ${result.failedCount} failed.`,
          'Dismiss',
          { duration: 8000 }
        );
        this.clearSelection();
        this.loadPage();
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
        this.clearSelection();

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
