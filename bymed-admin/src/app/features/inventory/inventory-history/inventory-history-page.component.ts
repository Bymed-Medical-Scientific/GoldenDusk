import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
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
import { PageLoadingComponent } from '@shared/components/page-loading/page-loading.component';
import { InventoryLogEntryDto, ProductDto } from '@shared/models';

const GUID_LIKE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Component({
  selector: 'app-inventory-history-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    GlobalErrorComponent,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatTableModule,
    PageLoadingComponent
  ],
  templateUrl: './inventory-history-page.component.html',
  styleUrl: './inventory-history-page.component.scss'
})
export class InventoryHistoryPageComponent implements OnInit, AfterViewInit {
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
  protected readonly dataSource = new MatTableDataSource<InventoryLogEntryDto>([]);
  protected readonly displayedColumns: string[] = [
    'createdAt',
    'previousCount',
    'newCount',
    'changeAmount',
    'reason',
    'changedBy'
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
        case 'createdAt':
          return new Date(row.createdAt).getTime();
        case 'previousCount':
          return row.previousCount;
        case 'newCount':
          return row.newCount;
        case 'changeAmount':
          return row.changeAmount;
        case 'reason':
          return row.reason;
        case 'changedBy':
          return row.changedBy;
        default:
          return '';
      }
    };

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

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort ?? null;
  }

  protected onProductOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const id = event.option.value as string;
    const product = this.searchResults().find((x) => x.id === id);
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
    this.dataSource.data = [];
    this.totalCount.set(0);
    this.errorMessage.set(null);
    if (this.paginator) {
      this.paginator.length = 0;
      this.paginator.pageIndex = 0;
    }
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

  protected onPageChange(event: PageEvent): void {
    this.pageNumber.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
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
