import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TablePaginationComponent, TablePageChange } from '@shared/components/table-pagination/table-pagination.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { ClientTypeDto } from '@shared/models';
import { paginateItems } from '@shared/utils/client-pagination';

@Component({
  selector: 'app-client-type-list',
  standalone: true,
  imports: [
    FormsModule,
    GlobalErrorComponent,
    TablePaginationComponent,
    TableSkeletonComponent,
    RouterLink
  ],
  templateUrl: './client-type-list.component.html',
  styleUrl: './client-type-list.component.scss'
})
export class ClientTypeListComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pageMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly rows = signal<ClientTypeDto[]>([]);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizeOptions = [10, 25, 50];

  protected readonly filteredRows = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) {
      return this.rows();
    }
    return this.rows().filter(
      (row) => row.name.toLowerCase().includes(q) || row.slug.toLowerCase().includes(q)
    );
  });

  protected readonly filteredCount = computed(() => this.filteredRows().length);

  protected readonly paginatedRows = computed(() =>
    paginateItems(this.filteredRows(), this.pageNumber(), this.pageSize())
  );

  public ngOnInit(): void {
    this.load();
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

  protected delete(row: ClientTypeDto): void {
    if (!window.confirm(`Delete "${row.name}"?`)) {
      return;
    }

    this.deletingId.set(row.id);
    this.pageMessage.set(null);
    this.adminApi
      .deleteClientType(row.id)
      .pipe(
        catchError((err: unknown) => {
          this.pageMessage.set(err instanceof ApiError ? err.message : 'Could not delete client type.');
          return EMPTY;
        }),
        finalize(() => this.deletingId.set(null))
      )
      .subscribe(() => {
        this.pageMessage.set('Client type deleted.');
        this.load();
      });
  }

  private load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.adminApi
      .getClientTypes()
      .pipe(
        catchError(() => {
          this.errorMessage.set('Client types could not be loaded. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((rows) => this.rows.set(rows));
  }
}
