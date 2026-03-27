import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { OrderSummaryDto, PagedResultDto } from '@shared/models';
import { OrderListComponent } from './order-list.component';

describe('OrderListComponent', () => {
  let fixture: ComponentFixture<OrderListComponent>;
  let component: OrderListComponent;
  let adminApiSpy: jasmine.SpyObj<AdminApiService>;
  let snackBar: MatSnackBar;
  let snackBarOpenSpy: jasmine.Spy;

  const shipping = {
    name: 'Alice',
    addressLine1: '1 Main St',
    city: 'City',
    state: 'ST',
    postalCode: '12345',
    country: 'US',
    phone: '555'
  };

  const orderRow: OrderSummaryDto = {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    orderNumber: 'BYM-1001',
    status: 0,
    customerEmail: 'buyer@example.com',
    customerName: 'Buyer Name',
    shippingAddress: shipping,
    subtotal: 100,
    tax: 0,
    shippingCost: 0,
    total: 100,
    currency: 'USD',
    exchangeRate: 1,
    paymentStatus: 1,
    paymentReference: 'pay-1',
    paymentMethod: 'card',
    items: [],
    creationTime: '2024-06-01T12:00:00.000Z'
  };

  const paged: PagedResultDto<OrderSummaryDto> = {
    items: [orderRow],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 1,
    totalPages: 1
  };

  beforeEach(async () => {
    adminApiSpy = jasmine.createSpyObj<AdminApiService>('AdminApiService', ['getOrders', 'exportOrders']);
    adminApiSpy.getOrders.and.returnValue(of(paged));
    adminApiSpy.exportOrders.and.returnValue(of(new Blob(['Id,OrderNumber'], { type: 'text/csv' })));

    await TestBed.configureTestingModule({
      imports: [OrderListComponent, NoopAnimationsModule],
      providers: [provideRouter([]), { provide: AdminApiService, useValue: adminApiSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderListComponent);
    component = fixture.componentInstance;
    snackBar = TestBed.inject(MatSnackBar);
    snackBarOpenSpy = spyOn(snackBar, 'open');
    (component as any).snackBar = snackBar;
    fixture.detectChanges();
  });

  it('loads orders and displays order number and customer', () => {
    expect(adminApiSpy.getOrders).toHaveBeenCalledWith(1, 10, {
      status: null,
      dateFrom: null,
      dateTo: null,
      search: null
    });
    expect((component as any).isLoading()).toBeFalse();
    expect((component as any).dataSource.data.length).toBe(1);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('BYM-1001');
    expect(text).toContain('Buyer Name');
  });

  it('applies status filter and reloads', () => {
    adminApiSpy.getOrders.calls.reset();
    (component as any).onStatusChange('1');
    fixture.detectChanges();

    expect(adminApiSpy.getOrders).toHaveBeenCalledWith(1, 10, {
      status: 1,
      dateFrom: null,
      dateTo: null,
      search: null
    });
  });

  it('applies search and date filters', () => {
    adminApiSpy.getOrders.calls.reset();
    (component as any).onSearchChange('BYM');
    (component as any).onDateFromChange('2024-01-01');
    (component as any).onDateToChange('2024-01-31');
    fixture.detectChanges();

    expect(adminApiSpy.getOrders.calls.mostRecent().args).toEqual([
      1,
      10,
      {
        status: null,
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        search: 'BYM'
      }
    ]);
  });

  it('clears filters and reloads with empty query', () => {
    (component as any).onSearchChange('x');
    (component as any).onStatusChange('2');
    adminApiSpy.getOrders.calls.reset();

    (component as any).clearFilters();
    fixture.detectChanges();

    expect(adminApiSpy.getOrders).toHaveBeenCalledWith(1, 10, {
      status: null,
      dateFrom: null,
      dateTo: null,
      search: null
    });
  });

  it('exports CSV using current filters', () => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:mock');
    spyOn(URL, 'revokeObjectURL');

    (component as any).onStatusChange('3');
    (component as any).onSearchChange('test');
    adminApiSpy.exportOrders.calls.reset();

    (component as any).exportToCsv();

    expect(adminApiSpy.exportOrders).toHaveBeenCalledWith({
      status: 3,
      dateFrom: null,
      dateTo: null,
      search: 'test'
    });
    expect(snackBarOpenSpy).toHaveBeenCalledWith('Export completed.', 'Dismiss', { duration: 3500 });
  });

  it('shows snackbar when export fails', () => {
    adminApiSpy.exportOrders.and.returnValue(throwError(() => new ApiError(500, 'Server error')));
    spyOn(URL, 'createObjectURL');

    (component as any).exportToCsv();

    expect(snackBarOpenSpy).toHaveBeenCalledWith('Server error', 'Dismiss', { duration: 8000 });
    expect((component as any).isExporting()).toBeFalse();
  });

  it('shows global error when list load fails', () => {
    adminApiSpy.getOrders.and.returnValue(throwError(() => new Error('network')));
    const errFixture = TestBed.createComponent(OrderListComponent);
    errFixture.detectChanges();

    expect((errFixture.componentInstance as any).errorMessage()).toBe('Orders could not be loaded. Please try again.');
  });
});
