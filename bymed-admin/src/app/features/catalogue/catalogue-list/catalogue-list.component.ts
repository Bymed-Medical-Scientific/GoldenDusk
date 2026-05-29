import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { CatalogueItemDto, CategoryDto } from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

type PublishedFilter = 'all' | 'published' | 'unpublished';

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
    TableSkeletonComponent,
    TagModule
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
    if (event.rows) this.pageSize.set(event.rows);
    this.loadPage();
  }

  protected deleteItem(item: CatalogueItemDto): void {
    if (!confirm(`Unpublish "${item.name}"?`)) return;
    this.deletingId.set(item.id);
    this.adminApi
      .deleteCatalogueItem(item.id)
      .pipe(
        tap(() => this.pageMessage.set('Catalogue item unpublished.')),
        catchError(() => {
          this.pageMessage.set('Failed to unpublish catalogue item.');
          return EMPTY;
        }),
        finalize(() => {
          this.deletingId.set(null);
          this.loadPage();
        })
      )
      .subscribe();
  }

  private loadPage(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const categoryId = this.selectedCategoryId();
    const published = this.publishedFilter();
    let isPublished: boolean | null = null;
    if (published === 'published') isPublished = true;
    if (published === 'unpublished') isPublished = false;

    this.adminApi
      .getCatalogueItems(this.pageNumber(), this.pageSize(), {
        categoryId: categoryId === 'all' ? null : categoryId,
        search: this.searchQuery().trim() || null,
        isPublished
      })
      .pipe(
        tap((result) => {
          this.items.set(result.items);
          this.totalCount.set(result.totalCount);
        }),
        catchError(() => {
          this.errorMessage.set('Failed to load catalogue items.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }
}
