import { Injectable, inject, signal } from '@angular/core';
import { catchError, finalize, of } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { InventoryItemDto } from '@shared/models';

/**
 * Shared low-stock snapshot for the admin shell (badge, banner) and refresh after mutations.
 */
@Injectable({
  providedIn: 'root'
})
export class LowStockAlertsService {
  private readonly adminApi = inject(AdminApiService);

  /** Products at or below their low-stock threshold (same source as dashboard alerts). */
  readonly items = signal<InventoryItemDto[]>([]);
  readonly isLoading = signal(false);

  /** Reload from API (silent failure → empty list). */
  public refresh(): void {
    this.isLoading.set(true);
    this.adminApi
      .getLowStockInventory()
      .pipe(
        catchError(() => of([] as InventoryItemDto[])),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((list) => this.items.set(list));
  }
}
