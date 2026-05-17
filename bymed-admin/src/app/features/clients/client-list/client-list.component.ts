import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize, forkJoin } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ClientDto, ClientTypeDto } from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [RouterLink, FormsModule, ButtonModule, MultiSelectModule, TableModule],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.scss'
})
export class ClientListComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly rows = signal<ClientDto[]>([]);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly clientTypes = signal<ClientTypeDto[]>([]);
  /** Bound to multiselect; empty means show all clients. */
  protected selectedClientTypeIds: string[] = [];

  public ngOnInit(): void {
    forkJoin({
      types: this.adminApi.getClientTypes(),
      clients: this.adminApi.getClients()
    })
      .pipe(
        catchError(() => {
          this.errorMessage.set('Could not load clients or types.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(({ types, clients }) => {
        this.clientTypes.set(types);
        this.rows.set(clients);
      });
  }

  protected delete(row: ClientDto): void {
    if (!window.confirm(`Delete client "${row.institutionName}"?`)) {
      return;
    }

    this.deletingId.set(row.id);
    this.adminApi
      .deleteClient(row.id)
      .pipe(
        catchError(() => {
          this.errorMessage.set('Could not delete client.');
          return EMPTY;
        }),
        finalize(() => this.deletingId.set(null))
      )
      .subscribe(() => this.load());
  }

  protected onClientTypesFilterChange(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const ids = this.selectedClientTypeIds;
    const filter = ids.length > 0 ? ids : undefined;
    this.adminApi
      .getClients(filter)
      .pipe(
        catchError(() => {
          this.errorMessage.set('Could not load clients.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((rows) => this.rows.set(rows));
  }
}
