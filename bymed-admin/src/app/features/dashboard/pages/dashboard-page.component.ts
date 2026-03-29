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

interface SalesSummary {
  readonly today: number;
  readonly week: number;
  readonly month: number;
  readonly currency: string;
}

interface KpiCard {
  readonly title: string;
  readonly value: string;
  readonly hint: string;
  readonly icon: string;
  readonly tone: 'red' | 'yellow' | 'green' | 'blue';
}

interface TrendPoint {
  readonly label: string;
  readonly value: number;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  providers: [CurrencyPipe],
  imports: [
    CurrencyPipe,
    DatePipe,
    GlobalErrorComponent,
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
  protected readonly totalOrderCount = signal(0);
  protected readonly totalProductCount = signal(0);
  protected readonly revenueTrend = signal<TrendPoint[]>([]);
  protected readonly statusBreakdown = computed(() => this.buildStatusBreakdown(this.recentOrders()));
  protected readonly customerSatisfaction = computed(() => {
    const breakdown = this.statusBreakdown();
    return breakdown.find((entry) => entry.label === 'Delivered')?.percent ?? 0;
  });
  protected readonly kpiCards = computed<readonly KpiCard[]>(() => {
    const summary = this.salesSummary();
    return [
      {
        title: 'TODAY SALES',
        value: this.currencyPipe.transform(summary.today, summary.currency, 'symbol', '1.0-0') ?? '$0',
        hint: `${this.totalOrderCount()} tracked order(s)`,
        icon: 'pi pi-dollar',
        tone: 'red'
      },
      {
        title: 'LAST 7 DAYS',
        value: this.currencyPipe.transform(summary.week, summary.currency, 'symbol', '1.0-0') ?? '$0',
        hint: 'Weekly revenue trend',
        icon: 'pi pi-chart-line',
        tone: 'yellow'
      },
      {
        title: 'PRODUCTS',
        value: `${this.totalProductCount()}`,
        hint: `${this.popularProducts().length} popular in view`,
        icon: 'pi pi-box',
        tone: 'green'
      },
      {
        title: 'LOW STOCK',
        value: `${this.lowStockItems().length}`,
        hint: 'Requires replenishment',
        icon: 'pi pi-exclamation-triangle',
        tone: 'blue'
      }
    ];
  });
  protected readonly hasDashboardData = computed(
    () =>
      this.recentOrders().length > 0 ||
      this.lowStockItems().length > 0 ||
      this.popularProducts().length > 0
  );

  public constructor(
    private readonly adminApiService: AdminApiService,
    private readonly lowStockAlerts: LowStockAlertsService,
    private readonly currencyPipe: CurrencyPipe
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
        this.totalOrderCount.set(orders.totalCount ?? orderItems.length);
        this.totalProductCount.set(products.totalCount ?? products.items.length);
        this.revenueTrend.set(this.buildRevenueTrend(orderItems));
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

  protected trendHeight(value: number): number {
    const all = this.revenueTrend();
    if (all.length === 0) {
      return 16;
    }

    const maxValue = Math.max(...all.map((point) => point.value), 1);
    return Math.max(10, Math.round((value / maxValue) * 100));
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

  private buildRevenueTrend(orders: OrderSummaryDto[]): TrendPoint[] {
    const now = new Date();
    const trend: TrendPoint[] = [];

    for (let idx = 5; idx >= 0; idx--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - idx, 1);
      const month = monthDate.getMonth();
      const year = monthDate.getFullYear();
      const label = monthDate.toLocaleString('en-US', { month: 'short' });
      const value = orders
        .filter((order) => {
          const date = new Date(order.creationTime);
          return date.getMonth() === month && date.getFullYear() === year;
        })
        .reduce((sum, order) => sum + order.total, 0);

      trend.push({ label, value });
    }

    return trend;
  }

  private buildStatusBreakdown(
    orders: readonly OrderSummaryDto[]
  ): ReadonlyArray<{ readonly label: string; readonly count: number; readonly percent: number }> {
    if (orders.length === 0) {
      return [];
    }

    const total = orders.length;
    const grouped = new Map<string, number>();
    for (const order of orders) {
      const label = this.orderStatusLabel(order.status);
      grouped.set(label, (grouped.get(label) ?? 0) + 1);
    }

    return [...grouped.entries()]
      .map(([label, count]) => ({
        label,
        count,
        percent: Math.round((count / total) * 100)
      }))
      .sort((left, right) => right.count - left.count);
  }
}
