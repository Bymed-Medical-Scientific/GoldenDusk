import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { AuthTokenStorageService } from '@core/auth/auth-token-storage.service';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { DashboardSkeletonComponent } from '@shared/components/dashboard-skeleton/dashboard-skeleton.component';
import { OrderSummaryDto, ProductDto } from '@shared/models';
import { orderStatusChipClass, orderStatusLabel } from '@shared/utils/order-status';

interface SalesSummary {
  readonly today: number;
  readonly week: number;
  readonly month: number;
  readonly currency: string;
}

type KpiAccent = 'orange' | 'teal' | 'blue' | 'yellow';
type ChartMetric = 'revenue' | 'orders' | 'fulfillment';

interface KpiCard {
  readonly title: string;
  readonly value: string;
  readonly changeLabel: string;
  readonly changePositive: boolean;
  readonly icon: string;
  readonly accent: KpiAccent;
  readonly sparkline: readonly number[];
}

interface TrendPoint {
  readonly label: string;
  readonly value: number;
  readonly orderCount: number;
}

interface StatusSlice {
  readonly label: string;
  readonly percent: number;
  readonly color: string;
}

interface MonthlyGoal {
  readonly label: string;
  readonly current: number;
  readonly target: number;
  readonly percent: number;
  readonly accent: KpiAccent;
  readonly formattedCurrent: string;
  readonly formattedTarget: string;
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
  private readonly tokenStorage = inject(AuthTokenStorageService);
  private readonly currencyPipe = inject(CurrencyPipe);

  protected readonly orderStatusLabel = orderStatusLabel;
  protected readonly orderStatusChipClass = orderStatusChipClass;

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly chartMetric = signal<ChartMetric>('revenue');
  protected readonly salesSummary = signal<SalesSummary>({
    today: 0,
    week: 0,
    month: 0,
    currency: 'USD'
  });
  protected readonly recentOrders = signal<OrderSummaryDto[]>([]);
  protected readonly popularProducts = signal<ProductDto[]>([]);
  protected readonly totalOrderCount = signal(0);
  protected readonly totalProductCount = signal(0);
  protected readonly revenueTrend = signal<TrendPoint[]>([]);
  protected readonly statusBreakdown = computed(() => this.buildStatusBreakdown(this.recentOrders()));
  protected readonly userName = computed(() => {
    const name = this.tokenStorage.getUser()?.name?.trim();
    return name ? name.split(/\s+/)[0] : 'Admin';
  });
  protected readonly kpiCards = computed<readonly KpiCard[]>(() => {
    const summary = this.salesSummary();
    const trend = this.revenueTrend();
    const monthChange = this.percentChange(
      trend.at(-1)?.value ?? 0,
      trend.at(-2)?.value ?? 0
    );
    const weekChange = this.percentChange(summary.week, summary.month / 4);
    const orderChange = this.percentChange(
      trend.at(-1)?.orderCount ?? 0,
      trend.at(-2)?.orderCount ?? 0
    );

    return [
      {
        title: 'Total Revenue',
        value: this.formatCurrency(summary.month, summary.currency),
        changeLabel: `${monthChange >= 0 ? '+' : ''}${monthChange.toFixed(1)}% vs last month`,
        changePositive: monthChange >= 0,
        icon: 'pi pi-dollar',
        accent: 'orange',
        sparkline: trend.map((point) => point.value)
      },
      {
        title: 'Weekly Revenue',
        value: this.formatCurrency(summary.week, summary.currency),
        changeLabel: `${weekChange >= 0 ? '+' : ''}${weekChange.toFixed(1)}% vs last week`,
        changePositive: weekChange >= 0,
        icon: 'pi pi-chart-line',
        accent: 'teal',
        sparkline: this.buildWeeklySparkline()
      },
      {
        title: 'Total Orders',
        value: `${this.totalOrderCount()}`,
        changeLabel: `${orderChange >= 0 ? '+' : ''}${orderChange.toFixed(1)}% vs last month`,
        changePositive: orderChange >= 0,
        icon: 'pi pi-shopping-cart',
        accent: 'blue',
        sparkline: trend.map((point) => point.orderCount)
      },
      {
        title: 'Products',
        value: `${this.totalProductCount()}`,
        changeLabel: `${this.popularProducts().length} featured in catalog`,
        changePositive: true,
        icon: 'pi pi-box',
        accent: 'yellow',
        sparkline: this.buildProductSparkline()
      }
    ];
  });
  protected readonly statusSlices = computed<readonly StatusSlice[]>(() => {
    const colors = ['var(--accent-orange)', 'var(--accent-teal)', 'var(--brand-primary)', 'var(--accent-yellow)'];
    return this.statusBreakdown().map((entry, index) => ({
      label: entry.label,
      percent: entry.percent,
      color: colors[index % colors.length]
    }));
  });
  protected readonly donutGradient = computed(() => {
    const slices = this.statusSlices();
    if (slices.length === 0) {
      return 'conic-gradient(var(--surface-hover) 0deg 360deg)';
    }

    let cursor = 0;
    const stops = slices.map((slice) => {
      const start = cursor;
      cursor += slice.percent * 3.6;
      return `${slice.color} ${start}deg ${cursor}deg`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  });
  protected readonly activeChartData = computed(() => {
    const metric = this.chartMetric();
    const trend = this.revenueTrend();

    if (metric === 'orders') {
      return trend.map((point) => point.orderCount);
    }

    if (metric === 'fulfillment') {
      const delivered = this.statusBreakdown().find((entry) => entry.label === 'Delivered')?.percent ?? 0;
      return trend.map(() => delivered);
    }

    return trend.map((point) => point.value);
  });
  protected readonly monthlyGoals = computed<readonly MonthlyGoal[]>(() => {
    const summary = this.salesSummary();
    const revenueTarget = Math.max(summary.month * 1.15, 1000);
    const deliveredPercent = this.statusBreakdown().find((entry) => entry.label === 'Delivered')?.percent ?? 0;

    return [
      {
        label: 'Monthly Revenue',
        current: summary.month,
        target: revenueTarget,
        percent: Math.min(100, Math.round((summary.month / revenueTarget) * 100)),
        accent: 'orange',
        formattedCurrent: this.formatCurrency(summary.month, summary.currency),
        formattedTarget: this.formatCurrency(revenueTarget, summary.currency)
      },
      {
        label: 'Order Fulfillment',
        current: deliveredPercent,
        target: 100,
        percent: deliveredPercent,
        accent: 'teal',
        formattedCurrent: `${deliveredPercent}%`,
        formattedTarget: '100%'
      }
    ];
  });
  protected readonly hasDashboardData = computed(
    () => this.recentOrders().length > 0 || this.popularProducts().length > 0
  );

  public ngOnInit(): void {
    this.loadDashboardOverview();
  }

  protected setChartMetric(metric: ChartMetric): void {
    this.chartMetric.set(metric);
  }

  protected sparklinePath(values: readonly number[], width: number, height: number): string {
    if (values.length === 0) {
      return '';
    }

    const max = Math.max(...values, 1);
    const step = values.length > 1 ? width / (values.length - 1) : 0;

    return values
      .map((value, index) => {
        const x = index * step;
        const y = height - (value / max) * (height * 0.75) - height * 0.125;
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  protected areaChartPath(values: readonly number[], width: number, height: number): string {
    if (values.length === 0) {
      return '';
    }

    const max = Math.max(...values, 1);
    const step = values.length > 1 ? width / (values.length - 1) : 0;
    const baseline = height - 4;

    const line = values
      .map((value, index) => {
        const x = index * step;
        const y = baseline - (value / max) * (height * 0.82);
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const lastX = (values.length - 1) * step;
    return `${line} L${lastX.toFixed(1)},${baseline} L0,${baseline} Z`;
  }

  protected areaChartLine(values: readonly number[], width: number, height: number): string {
    if (values.length === 0) {
      return '';
    }

    const max = Math.max(...values, 1);
    const step = values.length > 1 ? width / (values.length - 1) : 0;
    const baseline = height - 4;

    return values
      .map((value, index) => {
        const x = index * step;
        const y = baseline - (value / max) * (height * 0.82);
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  protected chartYLabels(values: readonly number[]): string[] {
    const max = Math.max(...values, 1);
    return [max, max * 0.66, max * 0.33, 0].map((value) => {
      if (this.chartMetric() === 'orders' || this.chartMetric() === 'fulfillment') {
        return Math.round(value).toString();
      }
      return this.formatCompactCurrency(value, this.salesSummary().currency);
    });
  }

  private loadDashboardOverview(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      orders: this.adminApiService.getOrders(1, 12),
      products: this.adminApiService.getProducts(1, 12)
    })
      .pipe(
        catchError(() => {
          this.errorMessage.set('Unable to load dashboard data right now. Please refresh and try again.');
          return of({
            orders: { items: [], pageNumber: 1, pageSize: 12, totalCount: 0, totalPages: 0 },
            products: { items: [], pageNumber: 1, pageSize: 12, totalCount: 0, totalPages: 0 }
          });
        })
      )
      .subscribe(({ orders, products }) => {
        const orderItems = [...orders.items].sort(
          (left, right) => new Date(right.creationTime).getTime() - new Date(left.creationTime).getTime()
        );

        this.salesSummary.set(this.buildSalesSummary(orderItems));
        this.recentOrders.set(orderItems.slice(0, 5));
        this.totalOrderCount.set(orders.totalCount ?? orderItems.length);
        this.totalProductCount.set(products.totalCount ?? products.items.length);
        this.revenueTrend.set(this.buildRevenueTrend(orderItems));
        this.popularProducts.set(
          [...products.items].sort((left, right) => right.price - left.price).slice(0, 5)
        );
        this.isLoading.set(false);
      });
  }

  private buildWeeklySparkline(): number[] {
    const now = new Date();
    const points: number[] = [];

    for (let day = 6; day >= 0; day--) {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const total = this.recentOrders()
        .filter((order) => {
          const created = new Date(order.creationTime);
          return created >= dayStart && created <= dayEnd;
        })
        .reduce((sum, order) => sum + order.total, 0);

      points.push(total);
    }

    return points.length ? points : [0, 0, 0, 0, 0, 0, 0];
  }

  private buildProductSparkline(): number[] {
    const count = this.totalProductCount();
    if (count === 0) {
      return [0, 0, 0, 0, 0, 0];
    }

    const base = Math.max(1, count - 5);
    return [base, base + 1, base + 1, base + 2, base + 3, count];
  }

  private percentChange(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }

  private formatCurrency(amount: number, currency: string): string {
    return this.currencyPipe.transform(amount, currency, 'symbol', '1.0-0') ?? '$0';
  }

  private formatCompactCurrency(amount: number, currency: string): string {
    if (amount >= 1000) {
      return `${this.currencyPipe.transform(amount / 1000, currency, 'symbol', '1.0-0') ?? '$0'}k`;
    }
    return this.currencyPipe.transform(amount, currency, 'symbol', '1.0-0') ?? '$0';
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
      const monthOrders = orders.filter((order) => {
        const date = new Date(order.creationTime);
        return date.getMonth() === month && date.getFullYear() === year;
      });
      const value = monthOrders.reduce((sum, order) => sum + order.total, 0);

      trend.push({ label, value, orderCount: monthOrders.length });
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

  public constructor(private readonly adminApiService: AdminApiService) {}
}
