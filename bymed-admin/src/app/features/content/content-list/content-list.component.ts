import { DatePipe, NgClass } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { PageContentSummaryDto } from '@shared/models';

/** CMS page count is small; API caps page size at 100. */
const CONTENT_LIST_PAGE_SIZE = 100;

@Component({
  selector: 'app-content-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    GlobalErrorComponent,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatSnackBarModule,
    MatTooltipModule,
    NgClass,
    TableSkeletonComponent,
    RouterLink
  ],
  templateUrl: './content-list.component.html',
  styleUrl: './content-list.component.scss'
})
export class ContentListComponent implements OnInit, AfterViewInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly dataSource = new MatTableDataSource<PageContentSummaryDto>([]);
  protected readonly displayedColumns: string[] = ['title', 'slug', 'lastUpdated', 'status', 'actions'];

  @ViewChild(MatPaginator) private paginator!: MatPaginator;
  @ViewChild(MatSort) private sort!: MatSort;

  public ngOnInit(): void {
    this.dataSource.filterPredicate = (row, filter) => {
      const parsed = JSON.parse(filter) as { q: string };
      const q = parsed.q.trim().toLowerCase();
      return !q || row.title.toLowerCase().includes(q) || row.slug.toLowerCase().includes(q);
    };

    this.dataSource.sortingDataAccessor = (row, property) => {
      switch (property) {
        case 'title':
          return row.title;
        case 'slug':
          return row.slug;
        case 'lastUpdated': {
          const raw = row.publishedAt ?? row.creationTime;
          return new Date(raw).getTime();
        }
        case 'status':
          return row.isPublished ? 1 : 0;
        default:
          return '';
      }
    };

    this.loadPages();
  }

  public ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.applyFilter();
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.applyFilter();
  }

  protected lastActivityIso(row: PageContentSummaryDto): string {
    return row.publishedAt ?? row.creationTime;
  }

  protected confirmDelete(row: PageContentSummaryDto): void {
    const data: ConfirmDialogData = {
      title: 'Delete this page?',
      message: `Permanently delete “${row.title}” (${row.slug})? Version history will be removed. This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      confirmColor: 'warn'
    };

    this.dialog
      .open(ConfirmDialogComponent, { data, width: 'min(440px, 92vw)' })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed !== true) {
          return;
        }
        this.adminApi
          .deletePageContent(row.slug)
          .pipe(
            catchError((err: unknown) => {
              const msg = err instanceof ApiError ? err.message : 'Could not delete the page.';
              this.snackBar.open(msg, 'Dismiss', { duration: 8000 });
              return EMPTY;
            })
          )
          .subscribe(() => {
            this.snackBar.open('Page deleted.', 'Dismiss', { duration: 4000 });
            this.loadPages();
          });
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
        this.dataSource.data = page.items;
        this.applyFilter();
      });
  }

  private applyFilter(): void {
    this.dataSource.filter = JSON.stringify({ q: this.searchQuery() });
    this.dataSource.paginator?.firstPage();
  }
}
