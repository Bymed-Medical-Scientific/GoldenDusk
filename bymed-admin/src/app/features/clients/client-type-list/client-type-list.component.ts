import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ClientTypeDto } from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-client-type-list',
  standalone: true,
  imports: [RouterLink, ButtonModule, TableModule],
  templateUrl: './client-type-list.component.html',
  styleUrl: './client-type-list.component.scss'
})
export class ClientTypeListComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly rows = signal<ClientTypeDto[]>([]);
  protected readonly deletingId = signal<string | null>(null);

  public ngOnInit(): void {
    this.load();
  }

  protected delete(row: ClientTypeDto): void {
    if (!window.confirm(`Delete "${row.name}"?`)) {
      return;
    }

    this.deletingId.set(row.id);
    this.adminApi
      .deleteClientType(row.id)
      .pipe(
        catchError(() => {
          this.errorMessage.set('Could not delete client type.');
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
      .getClientTypes()
      .pipe(
        catchError(() => {
          this.errorMessage.set('Could not load client types.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((rows) => this.rows.set(rows));
  }
}
