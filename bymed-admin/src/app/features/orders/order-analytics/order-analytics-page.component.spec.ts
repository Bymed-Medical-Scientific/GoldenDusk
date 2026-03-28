import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { OrderAnalyticsDto } from '@shared/models';
import { OrderAnalyticsPageComponent } from './order-analytics-page.component';

describe('OrderAnalyticsPageComponent', () => {
  let fixture: ComponentFixture<OrderAnalyticsPageComponent>;
  let component: OrderAnalyticsPageComponent;
  let adminApiSpy: jasmine.SpyObj<AdminApiService>;

  const analytics: OrderAnalyticsDto = {
    totalOrderCount: 3,
    totalRevenue: 300,
    averageOrderValue: 100,
    countByStatus: { '0': 1, '1': 2 },
    revenueByDay: [{ date: '2024-01-01', revenue: 100, orderCount: 1 }],
    topProducts: []
  };

  beforeEach(async () => {
    adminApiSpy = jasmine.createSpyObj<AdminApiService>('AdminApiService', ['getOrderAnalytics']);
    adminApiSpy.getOrderAnalytics.and.returnValue(of(analytics));

    await TestBed.configureTestingModule({
      imports: [OrderAnalyticsPageComponent, NoopAnimationsModule],
      providers: [provideRouter([]), { provide: AdminApiService, useValue: adminApiSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderAnalyticsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads analytics and exposes KPIs from API', () => {
    expect(adminApiSpy.getOrderAnalytics).toHaveBeenCalled();
    const data = (component as any).analytics();
    expect(data?.totalRevenue).toBe(300);
    expect(data?.totalOrderCount).toBe(3);
    expect((component as any).maxChartRevenue()).toBe(100);
  });

  it('changes chart aggregation when granularity changes', () => {
    (component as any).analytics.set({
      ...analytics,
      revenueByDay: [
        { date: '2024-01-08', revenue: 10, orderCount: 1 },
        { date: '2024-01-09', revenue: 5, orderCount: 1 }
      ]
    });
    (component as any).chartGranularity.set('week');
    fixture.detectChanges();

    const bars = (component as any).chartBars();
    expect(bars.length).toBe(1);
    expect(bars[0].revenue).toBe(15);
  });
});
