import { NgClass } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { InventoryItemDto } from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';

type StockScopeFilter = 'all' | 'low';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    ButtonModule,
    FormsModule,
    GlobalErrorComponent,
    InputTextModule,
    NgClass,
    PaginatorModule,
    SelectModule,
    TableModule,
    TableSkeletonComponent,
    RouterLink
  ],
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.scss'
})
export class InventoryListComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly stockScope = signal<StockScopeFilter>('all');
  protected readonly items = signal<InventoryItemDto[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizeOptions = [10, 25, 50];
  protected readonly stockScopeOptions: Array<{ label: string; value: StockScopeFilter }> = [
    { label: 'All products', value: 'all' },
    { label: 'Low stock only', value: 'low' }
  ];

  public ngOnInit(): void {
    const low = this.route.snapshot.queryParamMap.get('lowStock');
    if (low === '1' || low?.toLowerCase() === 'true') {
      this.stockScope.set('low');
    }

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

  protected onPageChange(event: PaginatorState): void {
    this.pageNumber.set((event.page ?? 0) + 1);
    this.pageSize.set(event.rows ?? this.pageSize());
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
        this.items.set(page.items);
      });
  }
}
