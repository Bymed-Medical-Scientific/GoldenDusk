import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { CatalogueItemDto, CategoryDto } from '@shared/models';
import { TablePaginationComponent, TablePageChange } from '@shared/components/table-pagination/table-pagination.component';

type PublishedFilter = 'all' | 'published' | 'unpublished';
type CatalogueRow = CatalogueItemDto & { readonly categoryDisplay: string };

interface StatusTab {
  readonly label: string;
  readonly value: PublishedFilter;
}

@Component({
  selector: 'app-catalogue-list',
  standalone: true,
  imports: [
    FormsModule,
    GlobalErrorComponent,
    TablePaginationComponent,
    RouterLink,
    TableSkeletonComponent
  ],
  templateUrl: './catalogue-list.component.html',
  styleUrl: './catalogue-list.component.scss'
})
export class CatalogueListComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pageMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly selectedCategoryId = signal<string>('all');
  protected readonly publishedFilter = signal<PublishedFilter>('all');
  protected readonly categoryMenuOpen = signal(false);
  protected readonly categories = signal<CategoryDto[]>([]);
  protected readonly items = signal<CatalogueItemDto[]>([]);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly totalCount = signal(0);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizeOptions = [10, 25, 50];
  protected readonly statusTabs: readonly StatusTab[] = [
    { label: 'All', value: 'all' },
    { label: 'Published', value: 'published' },
    { label: 'Unpublished', value: 'unpublished' }
  ];
  protected readonly selectedCategoryLabel = computed(() => {
    if (this.selectedCategoryId() === 'all') {
      return 'Category';
    }
    return this.categories().find((category) => category.id === this.selectedCategoryId())?.name ?? 'Category';
  });
  protected readonly displayItems = computed<CatalogueRow[]>(() =>
    this.items().map((row) => ({
      ...row,
      categoryDisplay: row.categoryName ?? this.resolveCategoryName(row.categoryId)
    }))
  );

  public ngOnInit(): void {
    this.adminApi.getCategories().subscribe({
      next: (list) => this.categories.set(list),
      error: () => this.categories.set([])
    });
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

  protected onStatusTabChange(value: PublishedFilter): void {
    this.publishedFilter.set(value);
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
    this.loadPage();
  }

  protected deleteItem(item: CatalogueItemDto): void {
    const confirmed = window.confirm(
      `Unpublish "${item.name}"?\n\nThe item will be removed from the public catalogue.`
    );
    if (!confirmed) {
      return;
    }

    this.deletingId.set(item.id);
    this.pageMessage.set(null);
    this.adminApi
      .deleteCatalogueItem(item.id)
      .pipe(
        catchError((err: unknown) => {
          this.pageMessage.set(
            err instanceof ApiError ? err.message : 'Could not unpublish catalogue item.'
          );
          return EMPTY;
        }),
        finalize(() => this.deletingId.set(null))
      )
      .subscribe(() => {
        this.pageMessage.set('Catalogue item unpublished.');
        this.loadPage();
      });
  }

  private resolveCategoryName(categoryId: string): string {
    return this.categories().find((c) => c.id === categoryId)?.name ?? 'Uncategorized';
  }

  private loadPage(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const published = this.publishedFilter();
    let isPublished: boolean | null = null;
    if (published === 'published') isPublished = true;
    if (published === 'unpublished') isPublished = false;

    this.adminApi
      .getCatalogueItems(this.pageNumber(), this.pageSize(), {
        categoryId: this.selectedCategoryId() === 'all' ? null : this.selectedCategoryId(),
        search: this.searchQuery().trim() || null,
        isPublished
      })
      .pipe(
        catchError(() => {
          this.errorMessage.set('Catalogue items could not be loaded. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((result) => {
        this.items.set(result.items);
        this.totalCount.set(result.totalCount);
        this.pageNumber.set(result.pageNumber);
        this.pageSize.set(result.pageSize);
      });
  }
}
