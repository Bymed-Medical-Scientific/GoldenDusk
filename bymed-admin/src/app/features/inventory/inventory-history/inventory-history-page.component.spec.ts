import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { of, throwError } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { InventoryLogEntryDto, PagedResultDto, ProductDto } from '@shared/models';
import { InventoryHistoryPageComponent } from './inventory-history-page.component';

describe('InventoryHistoryPageComponent', () => {
  let fixture: ComponentFixture<InventoryHistoryPageComponent>;
  let component: InventoryHistoryPageComponent;
  let adminApiSpy: jasmine.SpyObj<AdminApiService>;

  const product: ProductDto = {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Slide Kit',
    slug: 'slide-kit',
    description: 'Desc',
    sku: 'SKU-S',
    categoryId: '11111111-1111-1111-1111-111111111111',
    categoryName: 'Lab',
    price: 40,
    currency: 'USD',
    inventoryCount: 20,
    lowStockThreshold: 3,
    isAvailable: true
  };

  const logEntry: InventoryLogEntryDto = {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    productId: product.id,
    previousCount: 18,
    newCount: 20,
    changeAmount: 2,
    reason: 'Restock',
    changedBy: 'admin@test',
    createdAt: '2026-01-15T10:00:00.000Z'
  };

  const pagedHistory: PagedResultDto<InventoryLogEntryDto> = {
    items: [logEntry],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 1,
    totalPages: 1
  };

  beforeEach(async () => {
    adminApiSpy = jasmine.createSpyObj<AdminApiService>('AdminApiService', ['getProducts', 'getInventoryHistory']);
    adminApiSpy.getProducts.and.returnValue(
      of({ items: [product], pageNumber: 1, pageSize: 30, totalCount: 1, totalPages: 1 })
    );
    adminApiSpy.getInventoryHistory.and.returnValue(of(pagedHistory));

    await TestBed.configureTestingModule({
      imports: [InventoryHistoryPageComponent, NoopAnimationsModule],
      providers: [provideRouter([]), { provide: AdminApiService, useValue: adminApiSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryHistoryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('formatDelta prefixes positive changes with +', () => {
    expect((component as unknown as { formatDelta: (n: number) => string }).formatDelta(3)).toBe('+3');
    expect((component as unknown as { formatDelta: (n: number) => string }).formatDelta(-2)).toBe('-2');
    expect((component as unknown as { formatDelta: (n: number) => string }).formatDelta(0)).toBe('0');
  });

  it('loads history after a product is selected and renders log details', () => {
    (component as unknown as { searchResults: { set: (items: ProductDto[]) => void } }).searchResults.set([
      product
    ]);
    const event = { option: { value: product.id } } as MatAutocompleteSelectedEvent;

    (component as unknown as { onProductOptionSelected: (e: MatAutocompleteSelectedEvent) => void }).onProductOptionSelected(
      event
    );
    fixture.detectChanges();

    expect(adminApiSpy.getInventoryHistory).toHaveBeenCalledWith(product.id, 1, 10, {
      dateFrom: null,
      dateTo: null
    });
    expect(
      (component as unknown as { isLoading: () => boolean }).isLoading()
    ).toBeFalse();
    expect(component['dataSource'].data.length).toBe(1);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Restock');
    expect(text).toContain('+2');
  });

  it('sets error when history request fails', () => {
    adminApiSpy.getInventoryHistory.and.returnValue(throwError(() => new Error('fail')));

    (component as unknown as { searchResults: { set: (items: ProductDto[]) => void } }).searchResults.set([
      product
    ]);
    const event = { option: { value: product.id } } as MatAutocompleteSelectedEvent;
    (component as unknown as { onProductOptionSelected: (e: MatAutocompleteSelectedEvent) => void }).onProductOptionSelected(
      event
    );
    fixture.detectChanges();

    expect(
      (component as unknown as { errorMessage: () => string | null }).errorMessage()
    ).toBe('History could not be loaded. Please try again.');
  });

  it('clearProductSelection empties the history table', () => {
    (component as unknown as { searchResults: { set: (items: ProductDto[]) => void } }).searchResults.set([
      product
    ]);
    (component as unknown as { onProductOptionSelected: (e: MatAutocompleteSelectedEvent) => void }).onProductOptionSelected({
      option: { value: product.id }
    } as MatAutocompleteSelectedEvent);
    fixture.detectChanges();

    (component as unknown as { clearProductSelection: () => void }).clearProductSelection();
    fixture.detectChanges();

    expect(component['dataSource'].data.length).toBe(0);
    expect(
      (component as unknown as { selectedProduct: () => ProductDto | null }).selectedProduct()
    ).toBeNull();
  });
});
