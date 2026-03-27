import { CurrencyPipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { PageLoadingComponent } from '@shared/components/page-loading/page-loading.component';
import { OrderAnalyticsDto, SalesByDayPointDto } from '@shared/models';
import { orderStatusChipClass, orderStatusLabel } from '@shared/utils/order-status';

export type ChartGranularity = 'day' | 'week' | 'month';

export interface ChartBar {
  readonly label: string;
  readonly revenue: number;
  readonly orderCount: number;
}

@Component({
  selector: 'app-order-analytics-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    FormsModule,
    GlobalErrorComponent,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    NgClass,
    PageLoadingComponent,
    RouterLink
  ],
  templateUrl: './order-analytics-page.component.html',
  styleUrl: './order-analytics-page.component.scss'
})
export class OrderAnalyticsPageComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly analytics = signal<OrderAnalyticsDto | null>(null);

  protected readonly dateFrom = signal(this.defaultDateFrom());
  protected readonly dateTo = signal(this.defaultDateTo());
  protected readonly chartGranularity = signal<ChartGranularity>('day');

  protected readonly orderStatusLabel = orderStatusLabel;
  protected readonly orderStatusChipClass = orderStatusChipClass;

  protected readonly chartBars = computed(() => {
    const data = this.analytics();
    if (!data?.revenueByDay?.length) {
      return [] as ChartBar[];
    }
    return aggregateSalesForChart(data.revenueByDay, this.chartGranularity());
  });

  protected readonly maxChartRevenue = computed(() => {
    const bars = this.chartBars();
    if (!bars.length) {
      return 0;
    }
    return Math.max(...bars.map((b) => b.revenue), 0);
  });

  protected readonly statusEntries = computed(() => {
    const data = this.analytics();
    if (!data?.countByStatus) {
      return [] as { status: number; count: number }[];
    }
    return Object.entries(data.countByStatus).map(([k, count]) => ({
      status: Number.parseInt(k, 10),
      count
    }));
  });

  public ngOnInit(): void {
    this.loadAnalytics();
  }

  protected applyDateRange(): void {
    this.loadAnalytics();
  }

  protected resetToLast30Days(): void {
    this.dateFrom.set(this.defaultDateFrom());
    this.dateTo.set(this.defaultDateTo());
    this.loadAnalytics();
  }

  private loadAnalytics(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminApi
      .getOrderAnalytics({
        dateFrom: this.dateFrom().trim() || null,
        dateTo: this.dateTo().trim() || null
      })
      .pipe(
        catchError(() => {
          this.errorMessage.set('Analytics could not be loaded. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((result) => this.analytics.set(result));
  }

  private defaultDateFrom(): string {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return this.toInputDate(d);
  }

  private defaultDateTo(): string {
    return this.toInputDate(new Date());
  }

  private toInputDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

function aggregateSalesForChart(points: readonly SalesByDayPointDto[], g: ChartGranularity): ChartBar[] {
  if (!points.length) {
    return [];
  }
  if (g === 'day') {
    return points.map((p) => ({
      label: formatShortDay(p.date),
      revenue: p.revenue,
      orderCount: p.orderCount
    }));
  }
  if (g === 'week') {
    const bucket = new Map<string, { revenue: number; orderCount: number }>();
    for (const p of points) {
      const monday = startOfWeekMonday(parseDateOnly(p.date));
      const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      const cur = bucket.get(key) ?? { revenue: 0, orderCount: 0 };
      cur.revenue += p.revenue;
      cur.orderCount += p.orderCount;
      bucket.set(key, cur);
    }
    return [...bucket.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, v]) => ({
        label: `Week ${formatShortDay(key)}`,
        revenue: v.revenue,
        orderCount: v.orderCount
      }));
  }

  const bucket = new Map<string, { revenue: number; orderCount: number }>();
  for (const p of points) {
    const d = parseDateOnly(p.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const cur = bucket.get(key) ?? { revenue: 0, orderCount: 0 };
    cur.revenue += p.revenue;
    cur.orderCount += p.orderCount;
    bucket.set(key, cur);
  }
  return [...bucket.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => ({
      label: formatMonthLabel(key),
      revenue: v.revenue,
      orderCount: v.orderCount
    }));
}

function parseDateOnly(iso: string): Date {
  const [y, m, d] = iso.split('-').map((x) => Number.parseInt(x, 10));
  return new Date(y, m - 1, d);
}

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = x.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + offset);
  return x;
}

function formatShortDay(iso: string): string {
  const d = parseDateOnly(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map((x) => Number.parseInt(x, 10));
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}
