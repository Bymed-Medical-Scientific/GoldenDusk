import { HttpEventType, HttpResponse } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { Component, computed, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, filter, finalize, forkJoin, map, tap } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { CategoryDto, ImportProductsResultDto, ProductDto } from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';

type AvailabilityFilter = 'all' | 'available' | 'unavailable';
type StockFilter = 'all' | 'in-stock' | 'out-of-stock' | 'low-stock';
type ProductRow = ProductDto & { readonly categoryDisplay: string };

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    ButtonModule,
    CheckboxModule,
    CurrencyPipe,
    FormsModule,
    GlobalErrorComponent,
    InputTextModule,
    PaginatorModule,
    ProgressBarModule,
    SelectModule,
    TableModule,
    TableSkeletonComponent,
    RouterLink
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pageMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly selectedCategoryId = signal<string>('all');
  protected readonly availabilityFilter = signal<AvailabilityFilter>('all');
  protected readonly stockFilter = signal<StockFilter>('all');
  protected readonly categories = signal<CategoryDto[]>([]);
  protected readonly products = signal<ProductDto[]>([]);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly isBulkProcessing = signal(false);
  protected readonly importUploadProgress = signal<number | null>(null);
  protected readonly selectedProductIds = signal<Set<string>>(new Set<string>());
  protected readonly totalCount = signal(0);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizeOptions = [10, 25, 50];
  protected readonly categoryOptions = computed(() => [
    { label: 'All categories', value: 'all' },
    ...this.categories().map((category) => ({ label: category.name, value: category.id }))
  ]);
  protected readonly availabilityOptions: Array<{ label: string; value: AvailabilityFilter }> = [
    { label: 'All', value: 'all' },
    { label: 'Available', value: 'available' },
    { label: 'Unavailable', value: 'unavailable' }
  ];
  protected readonly stockOptions: Array<{ label: string; value: StockFilter }> = [
    { label: 'All', value: 'all' },
    { label: 'In stock', value: 'in-stock' },
    { label: 'Out of stock', value: 'out-of-stock' },
    { label: 'Low stock', value: 'low-stock' }
  ];
  protected readonly filteredProducts = computed<ProductRow[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const stock = this.stockFilter();

    return this.products()
      .map((row) => ({
        ...row,
        categoryDisplay: row.categoryName ?? this.resolveCategoryName(row.categoryId)
      }))
      .filter((row) => {
        const sku = row.sku ?? '';
        const matchesQuery =
          !q ||
          row.name.toLowerCase().includes(q) ||
          sku.toLowerCase().includes(q) ||
          row.categoryDisplay.toLowerCase().includes(q);
        const matchesStock =
          stock === 'all' ||
          (stock === 'in-stock' && row.inventoryCount > 0) ||
          (stock === 'out-of-stock' && row.inventoryCount <= 0) ||
          (stock === 'low-stock' &&
            row.inventoryCount > 0 &&
            row.inventoryCount <= row.lowStockThreshold);
        return matchesQuery && matchesStock;
      });
  });

  public ngOnInit(): void {
    this.loadPage();
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
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
  }

  protected onPageChange(event: PaginatorState): void {
    this.pageNumber.set((event.page ?? 0) + 1);
    this.pageSize.set(event.rows ?? this.pageSize());
    this.loadPage();
  }

  protected deleteProduct(product: ProductDto): void {
    const confirmed = window.confirm(
      `Delete "${product.name}"?\n\nThis action deactivates the product from the catalog.`
    );
    if (!confirmed) {
      return;
    }

    this.deletingId.set(product.id);
    this.pageMessage.set(null);
    this.adminApi
      .deleteProduct(product.id)
      .pipe(
        catchError((err: unknown) => {
          this.pageMessage.set(err instanceof ApiError ? err.message : 'Could not delete the product.');
          return EMPTY;
        }),
        finalize(() => this.deletingId.set(null))
      )
      .subscribe(() => {
        this.pageMessage.set('Product deleted.');
        this.loadPage();
      });
  }

  protected isSelected(productId: string): boolean {
    return this.selectedProductIds().has(productId);
  }

  protected isAllRowsSelected(): boolean {
    const rows = this.filteredProducts();
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
    const allIds = this.filteredProducts().map((row) => row.id);
    this.selectedProductIds.set(new Set(allIds));
  }

  protected clearSelection(): void {
    this.selectedProductIds.set(new Set<string>());
  }

  protected bulkDeleteSelected(): void {
    const selectedIds = Array.from(this.selectedProductIds());
    if (selectedIds.length === 0) {
      this.pageMessage.set('Select at least one product.');
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedIds.length} selected product(s)?\n\nThis action deactivates them from the catalog.`
    );
    if (!confirmed) {
      return;
    }

    this.isBulkProcessing.set(true);
    this.pageMessage.set(null);
    this.adminApi
      .bulkDeleteProducts({ productIds: selectedIds })
      .pipe(
        catchError((err: unknown) => {
          this.pageMessage.set(err instanceof ApiError ? err.message : 'Could not bulk delete products.');
          return EMPTY;
        }),
        finalize(() => this.isBulkProcessing.set(false))
      )
      .subscribe((result) => {
        this.pageMessage.set(`Processed ${result.processedCount}/${result.requestedCount} product(s).`);
        this.clearSelection();
        this.loadPage();
      });
  }

  protected bulkSetAvailability(isAvailable: boolean): void {
    const selectedIds = Array.from(this.selectedProductIds());
    if (selectedIds.length === 0) {
      this.pageMessage.set('Select at least one product.');
      return;
    }

    const verb = isAvailable ? 'available' : 'unavailable';
    const confirmed = window.confirm(`Mark ${selectedIds.length} selected product(s) as ${verb}?`);
    if (!confirmed) {
      return;
    }

    this.isBulkProcessing.set(true);
    this.pageMessage.set(null);
    this.adminApi
      .bulkSetProductAvailability({ productIds: selectedIds, isAvailable })
      .pipe(
        catchError((err: unknown) => {
          this.pageMessage.set(err instanceof ApiError ? err.message : 'Could not update availability.');
          return EMPTY;
        }),
        finalize(() => this.isBulkProcessing.set(false))
      )
      .subscribe((result) => {
        this.pageMessage.set(
          `Marked ${result.processedCount}/${result.requestedCount} product(s) as ${verb}.`
        );
        this.clearSelection();
        this.loadPage();
      });
  }

  protected exportSelected(): void {
    const selectedIds = Array.from(this.selectedProductIds());

    this.adminApi
      .exportProducts(selectedIds.length > 0 ? selectedIds : undefined)
      .pipe(
        catchError((err: unknown) => {
          this.pageMessage.set(err instanceof ApiError ? err.message : 'Could not export products.');
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
        this.pageMessage.set('Export completed.');
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
    this.pageMessage.set(null);
    this.adminApi
      .importProductsWithProgress(file)
      .pipe(
        tap((evt) => {
          if (evt.type === HttpEventType.UploadProgress && evt.total && evt.total > 0) {
            this.importUploadProgress.set(Math.round((100 * evt.loaded) / evt.total));
          }
        }),
        filter((evt): evt is HttpResponse<ImportProductsResultDto> => evt.type === HttpEventType.Response),
        map((evt) => evt.body!),
        catchError((err: unknown) => {
          this.pageMessage.set(err instanceof ApiError ? err.message : 'Could not import products.');
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
        this.pageMessage.set(
          `Import complete: ${result.importedCount} added, ${result.updatedCount} updated, ${result.failedCount} failed.`
        );
        this.clearSelection();
        this.loadPage();
      });
  }

  private resolveCategoryName(categoryId: string): string {
    return this.categories().find((c) => c.id === categoryId)?.name ?? 'Uncategorized';
  }

  private loadPage(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const categoryId = this.selectedCategoryId() === 'all' ? null : this.selectedCategoryId();
    const inStock =
      this.availabilityFilter() === 'all' ? null : this.availabilityFilter() === 'available';

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
        this.products.set(products.items);
        this.clearSelection();
      });
  }
}
