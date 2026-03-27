import { Component, OnInit, AfterViewInit, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { PageLoadingComponent } from '@shared/components/page-loading/page-loading.component';
import { CategoryDto } from '@shared/models';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    FormsModule,
    GlobalErrorComponent,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    PageLoadingComponent,
    RouterLink
  ],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss'
})
export class CategoryListComponent implements OnInit, AfterViewInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly dataSource = new MatTableDataSource<CategoryDto>([]);
  protected readonly displayedColumns: string[] = ['name', 'slug', 'displayOrder', 'actions'];
  protected readonly deletingId = signal<string | null>(null);

  @ViewChild(MatPaginator) private paginator!: MatPaginator;
  @ViewChild(MatSort) private sort!: MatSort;

  public ngOnInit(): void {
    this.dataSource.filterPredicate = (row, filter) => {
      const parsed = JSON.parse(filter) as { q: string };
      const q = parsed.q.trim().toLowerCase();
      return (
        !q ||
        row.name.toLowerCase().includes(q) ||
        row.slug.toLowerCase().includes(q) ||
        (row.description?.toLowerCase().includes(q) ?? false)
      );
    };

    this.loadCategories();
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

  protected deleteCategory(category: CategoryDto): void {
    const data: ConfirmDialogData = {
      title: 'Delete category',
      message: `Delete "${category.name}"? Products still assigned to this category cannot be deleted until they are moved.`,
      confirmLabel: 'Delete',
      confirmColor: 'warn'
    };

    this.dialog
      .open(ConfirmDialogComponent, { data, width: 'min(440px, 92vw)' })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed !== true) {
          return;
        }

        this.deletingId.set(category.id);
        this.adminApi
          .deleteCategory(category.id)
          .pipe(
            catchError((err: unknown) => {
              const message =
                err instanceof ApiError ? err.message : 'Could not delete the category.';
              this.snackBar.open(message, 'Dismiss', { duration: 8000 });
              return EMPTY;
            }),
            finalize(() => this.deletingId.set(null))
          )
          .subscribe(() => {
            this.snackBar.open('Category deleted.', 'Dismiss', { duration: 4000 });
            this.loadCategories();
          });
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
        this.dataSource.data = rows;
        this.applyFilter();
      });
  }

  private applyFilter(): void {
    this.dataSource.filter = JSON.stringify({
      q: this.searchQuery()
    });
    this.dataSource.paginator?.firstPage();
  }
}
