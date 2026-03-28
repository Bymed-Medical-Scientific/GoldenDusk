import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { LowStockAlertsService } from '@core/inventory/low-stock-alerts.service';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { DashboardSkeletonComponent } from '@shared/components/dashboard-skeleton/dashboard-skeleton.component';
import { InventoryItemDto, OrderSummaryDto, ProductDto } from '@shared/models';
import { orderStatusChipClass, orderStatusLabel } from '@shared/utils/order-status';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface SalesSummary {
  readonly today: number;
  readonly week: number;
  readonly month: number;
  readonly currency: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    GlobalErrorComponent,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    NgClass,
    DashboardSkeletonComponent,
    RouterLink
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent implements OnInit {
  protected readonly orderStatusLabel = orderStatusLabel;
  protected readonly orderStatusChipClass = orderStatusChipClass;

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly salesSummary = signal<SalesSummary>({
    today: 0,
    week: 0,
    month: 0,
    currency: 'USD'
  });
  protected readonly recentOrders = signal<OrderSummaryDto[]>([]);
  protected readonly lowStockItems = signal<InventoryItemDto[]>([]);
  protected readonly popularProducts = signal<ProductDto[]>([]);
  protected readonly hasDashboardData = computed(
    () =>
      this.recentOrders().length > 0 ||
      this.lowStockItems().length > 0 ||
      this.popularProducts().length > 0
  );

  public constructor(
    private readonly adminApiService: AdminApiService,
    private readonly lowStockAlerts: LowStockAlertsService
  ) {}

  public ngOnInit(): void {
    this.loadDashboardOverview();
  }

  private loadDashboardOverview(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      orders: this.adminApiService.getOrders(1, 12),
      inventory: this.adminApiService.getLowStockInventory(),
      products: this.adminApiService.getProducts(1, 12)
    })
      .pipe(
        catchError(() => {
          this.errorMessage.set('Unable to load dashboard data right now. Please refresh and try again.');
          return of({
            orders: { items: [], pageNumber: 1, pageSize: 12, totalCount: 0, totalPages: 0 },
            inventory: [],
            products: { items: [], pageNumber: 1, pageSize: 12, totalCount: 0, totalPages: 0 }
          });
        })
      )
      .subscribe(({ orders, inventory, products }) => {
        const orderItems = [...orders.items].sort(
          (left, right) =>
            new Date(right.creationTime).getTime() - new Date(left.creationTime).getTime()
        );

        this.salesSummary.set(this.buildSalesSummary(orderItems));
        this.recentOrders.set(orderItems.slice(0, 5));
        const sortedLow = [...inventory].sort(
          (left, right) => left.inventoryCount - right.inventoryCount
        );
        this.lowStockAlerts.items.set(sortedLow);
        this.lowStockItems.set(sortedLow.slice(0, 5));
        this.popularProducts.set(
          [...products.items]
            .sort((left, right) => right.inventoryCount - left.inventoryCount)
            .slice(0, 5)
        );
        this.isLoading.set(false);
      });
  }

  private buildSalesSummary(orders: OrderSummaryDto[]): SalesSummary {
    if (!orders.length) {
      return { today: 0, week: 0, month: 0, currency: 'USD' };
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const sumInRange = (fromDate: Date): number =>
      orders
        .filter((order) => new Date(order.creationTime) >= fromDate)
        .reduce((total, order) => total + order.total, 0);

    return {
      today: sumInRange(todayStart),
      week: sumInRange(weekStart),
      month: sumInRange(monthStart),
      currency: orders[0].currency
    };
  }
}
