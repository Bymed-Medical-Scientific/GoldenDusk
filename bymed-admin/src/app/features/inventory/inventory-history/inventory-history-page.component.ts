import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  finalize,
  map,
  of,
  switchMap
} from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { InventoryLogEntryDto, ProductDto } from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';

const GUID_LIKE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Component({
  selector: 'app-inventory-history-page',
  standalone: true,
  imports: [
    ButtonModule,
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    GlobalErrorComponent,
    InputTextModule,
    PaginatorModule,
    ProgressSpinnerModule,
    TableModule,
    TableSkeletonComponent
  ],
  templateUrl: './inventory-history-page.component.html',
  styleUrl: './inventory-history-page.component.scss'
})
export class InventoryHistoryPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminApi = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly productSearch = this.fb.nonNullable.control('');
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');

  protected readonly selectedProduct = signal<ProductDto | null>(null);
  protected readonly searchResults = signal<ProductDto[]>([]);
  protected readonly isSearchingProducts = signal(false);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly items = signal<InventoryLogEntryDto[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizeOptions = [10, 25, 50];

  public ngOnInit(): void {
    this.productSearch.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (this.selectedProduct()) {
            this.searchResults.set([]);
            return of(null);
          }
          const t = term.trim();
          if (GUID_LIKE.test(t)) {
            this.searchResults.set([]);
            return of(null);
          }
          if (t.length < 2) {
            this.searchResults.set([]);
            return of(null);
          }
          this.isSearchingProducts.set(true);
          return this.adminApi.getProducts(1, 30, { search: t }).pipe(
            map((page) => page.items),
            catchError(() => {
              this.searchResults.set([]);
              return of(null);
            }),
            finalize(() => this.isSearchingProducts.set(false))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((items) => {
        if (items !== null) {
          this.searchResults.set(items);
        }
      });

    this.productSearch.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((term) => {
      const p = this.selectedProduct();
      if (!p) {
        return;
      }
      const label = `${p.name} (${p.sku})`;
      if (term.trim() !== label.trim()) {
        this.clearProductSelection();
      }
    });
  }

  protected chooseProduct(productId: string): void {
    const product = this.searchResults().find((x) => x.id === productId);
    if (!product) {
      return;
    }
    this.selectedProduct.set(product);
    this.searchResults.set([]);
    this.productSearch.setValue(`${product.name} (${product.sku})`, { emitEvent: false });
    this.pageNumber.set(1);
    this.errorMessage.set(null);
    this.loadHistory();
  }

  protected clearProductSelection(): void {
    this.selectedProduct.set(null);
    this.searchResults.set([]);
    this.productSearch.setValue('');
    this.items.set([]);
    this.totalCount.set(0);
    this.errorMessage.set(null);
  }

  protected onDateFromChange(value: string): void {
    this.dateFrom.set(value ?? '');
    this.pageNumber.set(1);
    if (this.selectedProduct()) {
      this.loadHistory();
    }
  }

  protected onDateToChange(value: string): void {
    this.dateTo.set(value ?? '');
    this.pageNumber.set(1);
    if (this.selectedProduct()) {
      this.loadHistory();
    }
  }

  protected clearDateRange(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.pageNumber.set(1);
    if (this.selectedProduct()) {
      this.loadHistory();
    }
  }

  protected onPageChange(event: PaginatorState): void {
    this.pageNumber.set((event.page ?? 0) + 1);
    this.pageSize.set(event.rows ?? this.pageSize());
    this.loadHistory();
  }

  protected formatDelta(value: number): string {
    if (value > 0) {
      return `+${value}`;
    }
    return String(value);
  }

  private loadHistory(): void {
    const product = this.selectedProduct();
    if (!product) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const dateFrom = this.dateFrom().trim() || null;
    const dateTo = this.dateTo().trim() || null;

    this.adminApi
      .getInventoryHistory(product.id, this.pageNumber(), this.pageSize(), {
        dateFrom,
        dateTo
      })
      .pipe(
        catchError(() => {
          this.errorMessage.set('History could not be loaded. Please try again.');
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
