import { DatePipe } from '@angular/common';
import { Component, computed, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { PageContentSummaryDto } from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

/** CMS page count is small; API caps page size at 100. */
const CONTENT_LIST_PAGE_SIZE = 100;

@Component({
  selector: 'app-content-list',
  standalone: true,
  imports: [
    ButtonModule,
    DatePipe,
    FormsModule,
    GlobalErrorComponent,
    InputTextModule,
    TableModule,
    TableSkeletonComponent,
    TagModule,
    TooltipModule,
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
  protected readonly pages = signal<PageContentSummaryDto[]>([]);
  protected readonly filteredPages = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) {
      return this.pages();
    }
    return this.pages().filter(
      (row) => row.title.toLowerCase().includes(q) || row.slug.toLowerCase().includes(q)
    );
  });

  public ngOnInit(): void {
    this.loadPages();
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected lastActivityIso(row: PageContentSummaryDto): string {
    return row.publishedAt ?? row.creationTime;
  }

  protected confirmDelete(row: PageContentSummaryDto): void {
    const confirmed = window.confirm(
      `Permanently delete "${row.title}" (${row.slug})? Version history will be removed.`
    );
    if (!confirmed) {
      return;
    }

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
