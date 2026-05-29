import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { BrandDto } from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-brand-list',
  standalone: true,
  imports: [
    ButtonModule,
    FormsModule,
    GlobalErrorComponent,
    InputTextModule,
    RouterLink,
    TableModule,
    TableSkeletonComponent
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

  public ngOnInit(): void {
    this.loadBrands();
  }

  protected filteredBrands(): BrandDto[] {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.brands();
    return this.brands().filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.websiteUrl?.toLowerCase().includes(q) ?? false)
    );
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected deleteBrand(brand: BrandDto): void {
    const confirmed = window.confirm(
      `Delete "${brand.name}"?\n\nYou cannot delete brands that are assigned to catalogue items.`
    );
    if (!confirmed) return;

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
