import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { CatalogueItemDto, CategoryDto } from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';

type PublishedFilter = 'all' | 'published' | 'unpublished';
type CatalogueRow = CatalogueItemDto & { readonly categoryDisplay: string };

@Component({
  selector: 'app-catalogue-list',
  standalone: true,
  imports: [
    ButtonModule,
    FormsModule,
    GlobalErrorComponent,
    InputTextModule,
    PaginatorModule,
    RouterLink,
    SelectModule,
    TableModule,
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
  protected readonly categories = signal<CategoryDto[]>([]);
  protected readonly items = signal<CatalogueItemDto[]>([]);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly totalCount = signal(0);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizeOptions = [10, 25, 50];

  protected readonly categoryOptions = computed(() => [
    { label: 'All categories', value: 'all' },
    ...this.categories().map((c) => ({ label: c.name, value: c.id }))
  ]);

  protected readonly publishedOptions: Array<{ label: string; value: PublishedFilter }> = [
    { label: 'All', value: 'all' },
    { label: 'Published', value: 'published' },
    { label: 'Unpublished', value: 'unpublished' }
  ];

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
    this.searchQuery.set('');
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected onCategoryChange(value: string): void {
    this.selectedCategoryId.set(value);
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected onPublishedChange(value: PublishedFilter): void {
    this.publishedFilter.set(value);
    this.pageNumber.set(1);
    this.loadPage();
  }

  protected onPageChange(event: PaginatorState): void {
    this.pageNumber.set((event.page ?? 0) + 1);
    this.pageSize.set(event.rows ?? this.pageSize());
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
