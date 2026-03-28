import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { InventoryItemDto } from '@shared/models';
import { LowStockAlertsService } from './low-stock-alerts.service';

describe('LowStockAlertsService', () => {
  let service: LowStockAlertsService;
  let adminApiSpy: jasmine.SpyObj<AdminApiService>;

  const lowStockItem: InventoryItemDto = {
    productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    productName: 'Low item',
    sku: 'L-1',
    inventoryCount: 1,
    lowStockThreshold: 5,
    isAvailable: true,
    isLowStock: true
  };

  beforeEach(() => {
    adminApiSpy = jasmine.createSpyObj<AdminApiService>('AdminApiService', ['getLowStockInventory']);

    TestBed.configureTestingModule({
      providers: [{ provide: AdminApiService, useValue: adminApiSpy }]
    });
    service = TestBed.inject(LowStockAlertsService);
  });

  it('refresh stores items from API', () => {
    adminApiSpy.getLowStockInventory.and.returnValue(of([lowStockItem]));

    service.refresh();

    expect(adminApiSpy.getLowStockInventory).toHaveBeenCalled();
    expect(service.items()).toEqual([lowStockItem]);
    expect(service.isLoading()).toBeFalse();
  });

  it('refresh clears loading flag and uses empty list on API error', () => {
    adminApiSpy.getLowStockInventory.and.returnValue(throwError(() => new Error('offline')));

    service.refresh();

    expect(service.items()).toEqual([]);
    expect(service.isLoading()).toBeFalse();
  });
});
