import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { BrandDto } from '@shared/models';
import { TablePaginationComponent, TablePageChange } from '@shared/components/table-pagination/table-pagination.component';
import { paginateItems } from '@shared/utils/client-pagination';

@Component({
  selector: 'app-brand-list',
  standalone: true,
  imports: [
    FormsModule,
    GlobalErrorComponent,
    TablePaginationComponent,
    TableSkeletonComponent,
    RouterLink
  ],
  templateUrl: './brand-list.component.html',
  styleUrl: './brand-list.component.scss'
})
export class BrandListComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pageMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly brands = signal<BrandDto[]>([]);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizeOptions = [10, 25, 50];
  protected readonly filteredBrands = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) {
      return this.brands();
    }

    return this.brands().filter(
      (brand) =>
        brand.name.toLowerCase().includes(q) ||
        (brand.websiteUrl?.toLowerCase().includes(q) ?? false)
    );
  });
  protected readonly paginatedBrands = computed(() =>
    paginateItems(this.filteredBrands(), this.pageNumber(), this.pageSize())
  );

  public ngOnInit(): void {
    this.loadBrands();
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.pageNumber.set(1);
  }

  protected clearSearch(): void {
    this.onSearchChange('');
  }

  protected onPageChange(event: TablePageChange): void {
    this.pageNumber.set(event.pageNumber);
    this.pageSize.set(event.pageSize);
  }

  protected deleteBrand(brand: BrandDto): void {
    const confirmed = window.confirm(
      `Delete "${brand.name}"?\n\nYou cannot delete brands that are assigned to catalogue items.`
    );
    if (!confirmed) {
      return;
    }

    this.deletingId.set(brand.id);
    this.pageMessage.set(null);
    this.adminApi
      .deleteBrand(brand.id)
      .pipe(
        catchError((err: unknown) => {
          this.pageMessage.set(
            err instanceof ApiError ? err.message : 'Could not delete the brand.'
          );
          return EMPTY;
        }),
        finalize(() => this.deletingId.set(null))
      )
      .subscribe(() => {
        this.pageMessage.set('Brand deleted.');
        this.loadBrands();
      });
  }

  private loadBrands(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.adminApi
      .getBrands()
      .pipe(
        catchError(() => {
          this.errorMessage.set('Brands could not be loaded. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((list) => this.brands.set(list));
  }
}
