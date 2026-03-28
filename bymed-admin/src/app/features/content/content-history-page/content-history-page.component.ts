import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, EMPTY, filter, finalize, map } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { PageLoadingComponent } from '@shared/components/page-loading/page-loading.component';
import { ContentVersionSummaryDto } from '@shared/models';
import {
  ContentVersionPreviewDialogComponent,
  ContentVersionPreviewDialogData
} from '../content-version-preview-dialog/content-version-preview-dialog.component';

@Component({
  selector: 'app-content-history-page',
  standalone: true,
  imports: [
    DatePipe,
    GlobalErrorComponent,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
    PageLoadingComponent,
    RouterLink
  ],
  templateUrl: './content-history-page.component.html',
  styleUrl: './content-history-page.component.scss'
})
export class ContentHistoryPageComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly dataSource = new MatTableDataSource<ContentVersionSummaryDto>([]);
  protected readonly displayedColumns: string[] = ['createdAt', 'createdBy', 'actions'];
  protected readonly totalCount = signal(0);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly pageSizeOptions = [10, 20, 50];
  protected readonly revertingId = signal<string | null>(null);
  protected pageSlug = '';

  @ViewChild(MatPaginator) private paginator?: MatPaginator;

  public ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((p) => p.get('slug')),
        filter((s): s is string => !!s),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((slug) => {
        this.pageSlug = slug;
        this.pageNumber.set(1);
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
        this.loadPage();
      });
  }

  protected onPageChange(event: PageEvent): void {
    this.pageNumber.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadPage();
  }

  protected openPreview(row: ContentVersionSummaryDto): void {
    const data: ContentVersionPreviewDialogData = {
      slug: this.pageSlug,
      versionId: row.id
    };
    this.dialog.open(ContentVersionPreviewDialogComponent, {
      data,
      width: 'min(720px, 96vw)'
    });
  }

  protected confirmRevert(row: ContentVersionSummaryDto): void {
    const data: ConfirmDialogData = {
      title: 'Revert to this version?',
      message:
        'The current page body will be saved as a new version, then replaced with this snapshot. Title, slug, SEO fields, and publish status stay as they are now.',
      confirmLabel: 'Revert',
      confirmColor: 'warn'
    };

    this.dialog
      .open(ConfirmDialogComponent, { data, width: 'min(480px, 92vw)' })
      .afterClosed()
      .pipe(filter((c) => c === true))
      .subscribe(() => this.revert(row));
  }

  private revert(row: ContentVersionSummaryDto): void {
    this.revertingId.set(row.id);
    this.adminApi
      .revertContentToVersion(this.pageSlug, row.id)
      .pipe(
        catchError((err: unknown) => {
          const msg = err instanceof ApiError ? err.message : 'Revert failed.';
          this.snackBar.open(msg, 'Dismiss', { duration: 8000 });
          return EMPTY;
        }),
        finalize(() => this.revertingId.set(null))
      )
      .subscribe(() => {
        this.snackBar.open('Page body reverted. Open the editor to review.', 'Dismiss', { duration: 6000 });
        void this.router.navigate(['/content', this.pageSlug, 'edit']);
      });
  }

  private loadPage(): void {
    if (!this.pageSlug) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminApi
      .getContentVersionHistory(this.pageSlug, this.pageNumber(), this.pageSize())
      .pipe(
        catchError(() => {
          this.errorMessage.set('Version history could not be loaded. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((page) => {
        this.totalCount.set(page.totalCount);
        this.pageNumber.set(page.pageNumber);
        this.pageSize.set(page.pageSize);
        this.dataSource.data = page.items;

        if (this.paginator) {
          this.paginator.pageIndex = Math.max(page.pageNumber - 1, 0);
          this.paginator.pageSize = page.pageSize;
          this.paginator.length = page.totalCount;
        }
      });
  }
}
