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
import { TablePaginationComponent, TablePageChange } from '@shared/components/table-pagination/table-pagination.component';
import { ProgressBarModule } from 'primeng/progressbar';

type AvailabilityFilter = 'all' | 'active' | 'draft' | 'archived';
type ProductRow = ProductDto & { readonly categoryDisplay: string };

interface StatusTab {
  readonly label: string;
  readonly value: AvailabilityFilter;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    GlobalErrorComponent,
    TablePaginationComponent,
    ProgressBarModule,
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
  protected readonly categoryMenuOpen = signal(false);
  protected readonly categories = signal<CategoryDto[]>([]);
  protected readonly products = signal<ProductDto[]>([]);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly isBulkProcessing = signal(false);
  protected readonly isExporting = signal(false);
  protected readonly importUploadProgress = signal<number | null>(null);
  protected readonly selectedProductIds = signal<ReadonlySet<string>>(new Set());
  protected readonly totalCount = signal(0);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizeOptions = [10, 25, 50];
  protected readonly statusTabs: readonly StatusTab[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Draft', value: 'draft' },
    { label: 'Archived', value: 'archived' }
  ];
  protected readonly productRows = computed<ProductRow[]>(() =>
    this.products().map((row) => ({
      ...row,
      categoryDisplay: row.categoryName ?? this.resolveCategoryName(row.categoryId)
    }))
  );
  protected readonly selectedCategoryLabel = computed(() => {
    if (this.selectedCategoryId() === 'all') {
      return 'Category';
    }
    return this.categories().find((category) => category.id === this.selectedCategoryId())?.name ?? 'Category';
  });
  protected readonly allSelected = computed(() => {
    const rows = this.productRows();
    const selected = this.selectedProductIds();
    return rows.length > 0 && rows.every((row) => selected.has(row.id));
  });

  public ngOnInit(): void {
    this.loadPage();
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected clearSearch(): void {
    this.onSearchChange('');
  }

  protected onStatusTabChange(value: AvailabilityFilter): void {
    this.availabilityFilter.set(value);
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected toggleCategoryMenu(): void {
    this.categoryMenuOpen.update((open) => !open);
  }

  protected onCategoryChange(value: string): void {
    this.selectedCategoryId.set(value);
    this.categoryMenuOpen.set(false);
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected onPageChange(event: TablePageChange): void {
    this.pageNumber.set(event.pageNumber);
    this.pageSize.set(event.pageSize);
    this.selectedProductIds.set(new Set());
    this.loadPage();
  }

  protected toggleSelectAll(checked: boolean): void {
    if (!checked) {
      this.selectedProductIds.set(new Set());
      return;
    }
    this.selectedProductIds.set(new Set(this.productRows().map((row) => row.id)));
  }

  protected toggleRowSelection(productId: string, checked: boolean): void {
    const next = new Set(this.selectedProductIds());
    if (checked) {
      next.add(productId);
    } else {
      next.delete(productId);
    }
    this.selectedProductIds.set(next);
  }

  protected isRowSelected(productId: string): boolean {
    return this.selectedProductIds().has(productId);
  }

  protected clearSelection(): void {
    this.selectedProductIds.set(new Set());
  }

  protected statusBadgeClass(row: ProductRow): string {
    if (row.isAvailable) {
      return 'status-active';
    }
    return this.availabilityFilter() === 'archived' ? 'status-archived' : 'status-draft';
  }

  protected statusLabel(row: ProductRow): string {
    if (row.isAvailable) {
      return 'Active';
    }
    return this.availabilityFilter() === 'archived' ? 'Archived' : 'Draft';
  }

  protected stockLabel(row: ProductRow): string {
    return row.isAvailable ? '999' : '0';
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

    const verb = isAvailable ? 'active' : 'draft';
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
        this.pageMessage.set(`Updated ${result.processedCount}/${result.requestedCount} product(s).`);
        this.clearSelection();
        this.loadPage();
      });
  }

  protected exportProducts(): void {
    const selectedIds = Array.from(this.selectedProductIds());
    this.isExporting.set(true);

    this.adminApi
      .exportProducts(selectedIds.length > 0 ? selectedIds : undefined)
      .pipe(
        catchError((err: unknown) => {
          this.pageMessage.set(err instanceof ApiError ? err.message : 'Could not export products.');
          return EMPTY;
        }),
        finalize(() => this.isExporting.set(false))
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
    return this.categories().find((category) => category.id === categoryId)?.name ?? 'Uncategorized';
  }

  private loadPage(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const categoryId = this.selectedCategoryId() === 'all' ? null : this.selectedCategoryId();
    const isAvailable = this.resolveAvailabilityFilter();

    forkJoin({
      products: this.adminApi.getProducts(this.pageNumber(), this.pageSize(), {
        categoryId,
        search: this.searchQuery().trim() || null,
        isAvailable
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

  private resolveAvailabilityFilter(): boolean | null {
    switch (this.availabilityFilter()) {
      case 'active':
        return true;
      case 'draft':
      case 'archived':
        return false;
      default:
        return null;
    }
  }
}
