import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { CategoryDto } from '@shared/models';
import { TablePaginationComponent, TablePageChange } from '@shared/components/table-pagination/table-pagination.component';
import { paginateItems } from '@shared/utils/client-pagination';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    FormsModule,
    GlobalErrorComponent,
    TablePaginationComponent,
    TableSkeletonComponent,
    RouterLink
  ],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss'
})
export class CategoryListComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pageMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly categories = signal<CategoryDto[]>([]);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizeOptions = [10, 25, 50];
  protected readonly filteredCategories = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) {
      return this.categories();
    }

    return this.categories().filter((row) => {
      return (
        row.name.toLowerCase().includes(q) ||
        row.slug.toLowerCase().includes(q) ||
        (row.description?.toLowerCase().includes(q) ?? false)
      );
    });
  });
  protected readonly paginatedCategories = computed(() =>
    paginateItems(this.filteredCategories(), this.pageNumber(), this.pageSize())
  );

  public ngOnInit(): void {
    this.loadCategories();
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

  protected deleteCategory(category: CategoryDto): void {
    const confirmed = window.confirm(
      `Delete "${category.name}"?\n\nProducts assigned to this category cannot be deleted until they are moved.`
    );
    if (!confirmed) {
      return;
    }

    this.deletingId.set(category.id);
    this.pageMessage.set(null);
    this.adminApi
      .deleteCategory(category.id)
      .pipe(
        catchError(() => {
          this.pageMessage.set('Could not delete the category. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.deletingId.set(null))
      )
      .subscribe(() => {
        this.pageMessage.set('Category deleted successfully.');
        this.loadCategories();
      });
  }

  private loadCategories(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminApi
      .getCategories()
      .pipe(
        catchError(() => {
          this.errorMessage.set('Categories could not be loaded. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((rows) => {
        this.categories.set(rows);
      });
  }
}
