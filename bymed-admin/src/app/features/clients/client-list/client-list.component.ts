import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize, forkJoin } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TablePaginationComponent, TablePageChange } from '@shared/components/table-pagination/table-pagination.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { ClientDto, ClientTypeDto } from '@shared/models';
import { paginateItems } from '@shared/utils/client-pagination';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [
    FormsModule,
    GlobalErrorComponent,
    TablePaginationComponent,
    TableSkeletonComponent,
    RouterLink
  ],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.scss'
})
export class ClientListComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pageMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly rows = signal<ClientDto[]>([]);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly clientTypes = signal<ClientTypeDto[]>([]);
  protected readonly selectedClientTypeId = signal<string>('all');
  protected readonly typeMenuOpen = signal(false);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizeOptions = [10, 25, 50];

  protected readonly selectedTypeLabel = computed(() => {
    if (this.selectedClientTypeId() === 'all') {
      return 'Client type';
    }
    return (
      this.clientTypes().find((type) => type.id === this.selectedClientTypeId())?.name ?? 'Client type'
    );
  });

  protected readonly filteredRows = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) {
      return this.rows();
    }
    return this.rows().filter((row) => {
      const phone = row.phone ?? row.telephone ?? '';
      return (
        row.institutionName.toLowerCase().includes(q) ||
        (row.email?.toLowerCase().includes(q) ?? false) ||
        phone.toLowerCase().includes(q) ||
        row.clientTypeName.toLowerCase().includes(q)
      );
    });
  });

  protected readonly filteredCount = computed(() => this.filteredRows().length);

  protected readonly paginatedRows = computed(() =>
    paginateItems(this.filteredRows(), this.pageNumber(), this.pageSize())
  );

  public ngOnInit(): void {
    forkJoin({
      types: this.adminApi.getClientTypes(),
      clients: this.adminApi.getClients()
    })
      .pipe(
        catchError(() => {
          this.errorMessage.set('Clients could not be loaded. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(({ types, clients }) => {
        this.clientTypes.set(types);
        this.rows.set(clients);
      });
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.pageNumber.set(1);
  }

  protected clearSearch(): void {
    this.onSearchChange('');
  }

  protected toggleTypeMenu(): void {
    this.typeMenuOpen.update((open) => !open);
  }

  protected onTypeChange(typeId: string): void {
    this.selectedClientTypeId.set(typeId);
    this.typeMenuOpen.set(false);
    this.pageNumber.set(1);
    this.loadClients();
  }

  protected onPageChange(event: TablePageChange): void {
    this.pageNumber.set(event.pageNumber);
    this.pageSize.set(event.pageSize);
  }

  protected phoneDisplay(row: ClientDto): string {
    return row.phone ?? row.telephone ?? '—';
  }

  protected delete(row: ClientDto): void {
    if (!window.confirm(`Delete client "${row.institutionName}"?`)) {
      return;
    }

    this.deletingId.set(row.id);
    this.pageMessage.set(null);
    this.adminApi
      .deleteClient(row.id)
      .pipe(
        catchError((err: unknown) => {
          this.pageMessage.set(err instanceof ApiError ? err.message : 'Could not delete client.');
          return EMPTY;
        }),
        finalize(() => this.deletingId.set(null))
      )
      .subscribe(() => {
        this.pageMessage.set('Client deleted.');
        this.loadClients();
      });
  }

  private loadClients(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const typeId = this.selectedClientTypeId();
    const filter = typeId === 'all' ? undefined : [typeId];

    this.adminApi
      .getClients(filter)
      .pipe(
        catchError(() => {
          this.errorMessage.set('Clients could not be loaded. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((rows) => this.rows.set(rows));
  }
}
