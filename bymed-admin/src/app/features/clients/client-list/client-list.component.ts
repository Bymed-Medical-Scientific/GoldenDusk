import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ClientDto } from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [RouterLink, ButtonModule, TableModule],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.scss'
})
export class ClientListComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly rows = signal<ClientDto[]>([]);
  protected readonly deletingId = signal<string | null>(null);

  public ngOnInit(): void {
    this.load();
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

  private load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.adminApi
      .getClients()
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
