import { DatePipe, NgClass } from '@angular/common';
import { Component, computed, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { TablePaginationComponent, TablePageChange } from '@shared/components/table-pagination/table-pagination.component';
import { PageContentSummaryDto } from '@shared/models';
import { paginateItems } from '@shared/utils/client-pagination';

/** CMS page count is small; API caps page size at 100. */
const CONTENT_LIST_PAGE_SIZE = 100;

type PublishFilter = 'all' | 'published' | 'draft';

interface StatusTab {
  readonly label: string;
  readonly value: PublishFilter;
}

@Component({
  selector: 'app-content-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    GlobalErrorComponent,
    NgClass,
    TablePaginationComponent,
    TableSkeletonComponent,
    RouterLink
  ],
  templateUrl: './content-list.component.html',
  styleUrl: './content-list.component.scss'
})
export class ContentListComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pageMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly publishFilter = signal<PublishFilter>('all');
  protected readonly pages = signal<PageContentSummaryDto[]>([]);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizeOptions = [10, 25, 50];
  protected readonly statusTabs: readonly StatusTab[] = [
    { label: 'All', value: 'all' },
    { label: 'Published', value: 'published' },
    { label: 'Draft', value: 'draft' }
  ];

  protected readonly filteredPages = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const filter = this.publishFilter();

    return this.pages().filter((row) => {
      if (filter === 'published' && !row.isPublished) {
        return false;
      }
      if (filter === 'draft' && row.isPublished) {
        return false;
      }
      if (!q) {
        return true;
      }
      return row.title.toLowerCase().includes(q) || row.slug.toLowerCase().includes(q);
    });
  });

  protected readonly filteredCount = computed(() => this.filteredPages().length);

  protected readonly paginatedPages = computed(() =>
    paginateItems(this.filteredPages(), this.pageNumber(), this.pageSize())
  );

  public ngOnInit(): void {
    this.loadPages();
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.pageNumber.set(1);
  }

  protected clearSearch(): void {
    this.onSearchChange('');
  }

  protected onStatusTabChange(value: PublishFilter): void {
    this.publishFilter.set(value);
    this.pageNumber.set(1);
  }

  protected onPageChange(event: TablePageChange): void {
    this.pageNumber.set(event.pageNumber);
    this.pageSize.set(event.pageSize);
  }

  protected lastActivityIso(row: PageContentSummaryDto): string {
    return row.publishedAt ?? row.creationTime;
  }

  protected statusBadgeClass(isPublished: boolean): string {
    return isPublished ? 'status-active' : 'status-draft';
  }

  protected statusLabel(isPublished: boolean): string {
    return isPublished ? 'Published' : 'Draft';
  }

  protected confirmDelete(row: PageContentSummaryDto): void {
    const confirmed = window.confirm(
      `Permanently delete "${row.title}" (${row.slug})? Version history will be removed.`
    );
    if (!confirmed) {
      return;
    }

    this.pageMessage.set(null);
    this.adminApi
      .deletePageContent(row.slug)
      .pipe(
        catchError((err: unknown) => {
          const msg = err instanceof ApiError ? err.message : 'Could not delete the page.';
          this.pageMessage.set(msg);
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.pageMessage.set('Page deleted.');
        this.loadPages();
      });
  }

  private loadPages(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminApi
      .getContentPages(1, CONTENT_LIST_PAGE_SIZE)
      .pipe(
        catchError(() => {
          this.errorMessage.set('Content pages could not be loaded. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((page) => {
        this.pages.set(page.items);
      });
  }
}
