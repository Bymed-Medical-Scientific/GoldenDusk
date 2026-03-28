import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { InventoryItemDto, PagedResultDto } from '@shared/models';
import { InventoryListComponent } from './inventory-list.component';

describe('InventoryListComponent', () => {
  let fixture: ComponentFixture<InventoryListComponent>;
  let component: InventoryListComponent;
  let adminApiSpy: jasmine.SpyObj<AdminApiService>;

  const item: InventoryItemDto = {
    productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    productName: 'Test Pump',
    sku: 'SKU-P1',
    inventoryCount: 3,
    lowStockThreshold: 5,
    isAvailable: true,
    isLowStock: true
  };

  const paged: PagedResultDto<InventoryItemDto> = {
    items: [item],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 1,
    totalPages: 1
  };

  beforeEach(async () => {
    adminApiSpy = jasmine.createSpyObj<AdminApiService>('AdminApiService', ['getInventory']);
    adminApiSpy.getInventory.and.returnValue(of(paged));

    await TestBed.configureTestingModule({
      imports: [InventoryListComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AdminApiService, useValue: adminApiSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } }
        }
      ]
    }).compileComponents();
  });

  it('loads inventory and shows product name and stock in the table', () => {
    fixture = TestBed.createComponent(InventoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(adminApiSpy.getInventory).toHaveBeenCalledWith(1, 10, {
      lowStockOnly: false,
      search: null
    });
    expect((component as unknown as { isLoading: () => boolean }).isLoading()).toBeFalse();
    expect(component['dataSource'].data.length).toBe(1);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Test Pump');
    expect(text).toContain('SKU-P1');
    expect(text).toContain('3');
    expect(text).toContain('Low');
  });

  it('applies low stock filter when route has lowStock=1', async () => {
    TestBed.resetTestingModule();
    adminApiSpy = jasmine.createSpyObj<AdminApiService>('AdminApiService', ['getInventory']);
    adminApiSpy.getInventory.and.returnValue(of(paged));

    await TestBed.configureTestingModule({
      imports: [InventoryListComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AdminApiService, useValue: adminApiSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ lowStock: '1' }) } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(adminApiSpy.getInventory).toHaveBeenCalledWith(1, 10, {
      lowStockOnly: true,
      search: null
    });
    expect(
      (component as unknown as { stockScope: () => string }).stockScope()
    ).toBe('low');
  });

  it('reloads with search and low-stock scope when filters change', () => {
    fixture = TestBed.createComponent(InventoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    adminApiSpy.getInventory.calls.reset();

    (component as unknown as { onSearchChange: (v: string) => void }).onSearchChange('pump');
    expect(adminApiSpy.getInventory).toHaveBeenCalledWith(1, 10, {
      lowStockOnly: false,
      search: 'pump'
    });

    (component as unknown as { onStockScopeChange: (v: 'all' | 'low') => void }).onStockScopeChange(
      'low'
    );
    expect(adminApiSpy.getInventory).toHaveBeenCalledWith(1, 10, {
      lowStockOnly: true,
      search: 'pump'
    });
  });

  it('shows error message when inventory load fails', () => {
    adminApiSpy.getInventory.and.returnValue(throwError(() => new Error('network')));

    fixture = TestBed.createComponent(InventoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(
      (component as unknown as { errorMessage: () => string | null }).errorMessage()
    ).toBe('Inventory could not be loaded. Please try again.');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Inventory could not be loaded');
  });
});
