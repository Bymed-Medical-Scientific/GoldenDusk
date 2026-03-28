import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { of } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { LowStockAlertsService } from '@core/inventory/low-stock-alerts.service';
import { CategoryDto, InventoryItemDto, ProductDto } from '@shared/models';
import { InventoryAdjustPageComponent } from './inventory-adjust-page.component';

describe('InventoryAdjustPageComponent', () => {
  let fixture: ComponentFixture<InventoryAdjustPageComponent>;
  let component: InventoryAdjustPageComponent;
  let adminApiSpy: jasmine.SpyObj<AdminApiService>;
  let dialog: MatDialog;
  let snackBar: MatSnackBar;
  let openDialogSpy: jasmine.Spy;
  let snackBarOpenSpy: jasmine.Spy;
  let lowStockSpy: jasmine.SpyObj<LowStockAlertsService>;

  const category: CategoryDto = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Lab',
    slug: 'lab',
    description: 'Lab',
    displayOrder: 1
  };

  const product: ProductDto = {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Beaker Set',
    slug: 'beaker-set',
    description: 'Desc',
    sku: 'SKU-B',
    categoryId: category.id,
    categoryName: category.name,
    price: 10,
    currency: 'USD',
    inventoryCount: 10,
    lowStockThreshold: 2,
    isAvailable: true
  };

  const updatedInventory: InventoryItemDto = {
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    inventoryCount: 12,
    lowStockThreshold: 2,
    isAvailable: true,
    isLowStock: false
  };

  beforeEach(async () => {
    adminApiSpy = jasmine.createSpyObj<AdminApiService>('AdminApiService', [
      'getProducts',
      'adjustInventory'
    ]);
    adminApiSpy.getProducts.and.returnValue(
      of({ items: [product], pageNumber: 1, pageSize: 30, totalCount: 1, totalPages: 1 })
    );
    adminApiSpy.adjustInventory.and.returnValue(of(updatedInventory));

    lowStockSpy = jasmine.createSpyObj<LowStockAlertsService>('LowStockAlertsService', ['refresh']);

    await TestBed.configureTestingModule({
      imports: [InventoryAdjustPageComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AdminApiService, useValue: adminApiSpy },
        { provide: LowStockAlertsService, useValue: lowStockSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryAdjustPageComponent);
    component = fixture.componentInstance;
    dialog = TestBed.inject(MatDialog);
    snackBar = TestBed.inject(MatSnackBar);
    openDialogSpy = spyOn(dialog, 'open').and.returnValue({
      afterClosed: () => of(false)
    } as never);
    snackBarOpenSpy = spyOn(snackBar, 'open');
    (component as unknown as { dialog: MatDialog }).dialog = dialog;
    (component as unknown as { snackBar: MatSnackBar }).snackBar = snackBar;
    fixture.detectChanges();
  });

  describe('adjustment form validation', () => {
    it('marks newStockCount invalid when negative', () => {
      const form = (component as unknown as { adjustForm: { controls: { newStockCount: { setValue: (v: number) => void; valid: boolean } } } }).adjustForm;
      form.controls.newStockCount.setValue(-1);
      expect(form.controls.newStockCount.valid).toBeFalse();
    });

    it('requires reason and caps length at 500', () => {
      const form = (component as unknown as {
        adjustForm: {
          controls: {
            reason: { setValue: (v: string) => void; valid: boolean; errors: Record<string, unknown> | null };
          };
        };
      }).adjustForm;

      form.controls.reason.setValue('');
      expect(form.controls.reason.valid).toBeFalse();

      form.controls.reason.setValue('x'.repeat(501));
      expect(form.controls.reason.valid).toBeFalse();
      expect(form.controls.reason.errors?.['maxlength']).toBeDefined();

      form.controls.reason.setValue('Damaged batch');
      expect(form.controls.reason.valid).toBeTrue();
    });

    it('reasonLength reflects current reason control value', () => {
      (component as unknown as { adjustForm: { patchValue: (v: { reason: string }) => void } }).adjustForm.patchValue({
        reason: 'abc'
      });
      expect((component as unknown as { reasonLength: () => number }).reasonLength()).toBe(3);
    });
  });

  it('promptSubmit does not open dialog when form is invalid', () => {
    (component as unknown as { selectedProduct: { set: (p: ProductDto | null) => void } }).selectedProduct.set(
      product
    );
    (component as unknown as { adjustForm: { patchValue: (v: { newStockCount: number; reason: string }) => void } }).adjustForm.patchValue({
      newStockCount: 5,
      reason: ''
    });

    (component as unknown as { promptSubmit: () => void }).promptSubmit();

    expect(openDialogSpy).not.toHaveBeenCalled();
  });

  it('promptSubmit shows snackbar when new count equals current stock', () => {
    (component as unknown as { selectedProduct: { set: (p: ProductDto | null) => void } }).selectedProduct.set(
      product
    );
    (component as unknown as { adjustForm: { patchValue: (v: { newStockCount: number; reason: string }) => void } }).adjustForm.patchValue({
      newStockCount: product.inventoryCount,
      reason: 'No actual change'
    });

    (component as unknown as { promptSubmit: () => void }).promptSubmit();

    expect(openDialogSpy).not.toHaveBeenCalled();
    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'New stock count matches the current level. Enter a different value.',
      'Dismiss',
      { duration: 6000 }
    );
  });

  it('selecting a product seeds newStockCount from current inventory', () => {
    (component as unknown as { searchResults: { set: (items: ProductDto[]) => void } }).searchResults.set([
      product
    ]);
    const event = { option: { value: product.id } } as MatAutocompleteSelectedEvent;

    (component as unknown as { onProductOptionSelected: (e: MatAutocompleteSelectedEvent) => void }).onProductOptionSelected(
      event
    );

    const newStock = (component as unknown as { adjustForm: { getRawValue: () => { newStockCount: number } } }).adjustForm.getRawValue()
      .newStockCount;
    expect(newStock).toBe(product.inventoryCount);
  });
});
