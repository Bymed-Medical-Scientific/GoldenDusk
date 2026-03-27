import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { BulkOperationResultDto, CategoryDto, PagedResultDto, ProductDto } from '@shared/models';
import { ProductListComponent } from './product-list.component';

describe('ProductListComponent', () => {
  let fixture: ComponentFixture<ProductListComponent>;
  let component: ProductListComponent;
  let adminApiSpy: jasmine.SpyObj<AdminApiService>;
  let dialog: MatDialog;
  let snackBar: MatSnackBar;
  let openDialogSpy: jasmine.Spy;
  let snackBarOpenSpy: jasmine.Spy;

  const category: CategoryDto = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Imaging',
    slug: 'imaging',
    description: 'Imaging',
    displayOrder: 1
  };

  const productA: ProductDto = {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Microscope X1',
    slug: 'microscope-x1',
    description: 'Desc',
    sku: 'SKU-1',
    categoryId: category.id,
    categoryName: category.name,
    price: 99.5,
    currency: 'USD',
    inventoryCount: 5,
    lowStockThreshold: 2,
    isAvailable: true
  };

  const productB: ProductDto = {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'Centrifuge Pro',
    slug: 'centrifuge-pro',
    description: 'Desc',
    sku: 'SKU-2',
    categoryId: category.id,
    categoryName: category.name,
    price: 1200,
    currency: 'USD',
    inventoryCount: 0,
    lowStockThreshold: 1,
    isAvailable: false
  };

  const pagedProducts: PagedResultDto<ProductDto> = {
    items: [productA, productB],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1
  };

  const bulkOk: BulkOperationResultDto = {
    requestedCount: 2,
    processedCount: 2,
    notFoundCount: 0
  };

  beforeEach(async () => {
    adminApiSpy = jasmine.createSpyObj<AdminApiService>('AdminApiService', [
      'getProducts',
      'getCategories',
      'deleteProduct',
      'bulkDeleteProducts',
      'bulkSetProductAvailability',
      'exportProducts',
      'importProducts'
    ]);
    adminApiSpy.getProducts.and.returnValue(of(pagedProducts));
    adminApiSpy.getCategories.and.returnValue(of([category]));
    adminApiSpy.bulkDeleteProducts.and.returnValue(of(bulkOk));
    adminApiSpy.bulkSetProductAvailability.and.returnValue(of(bulkOk));
    adminApiSpy.exportProducts.and.returnValue(of(new Blob(['id,name'], { type: 'text/csv' })));
    adminApiSpy.importProducts.and.returnValue(
      of({ importedCount: 0, updatedCount: 0, failedCount: 0, errors: [] })
    );

    await TestBed.configureTestingModule({
      imports: [ProductListComponent, NoopAnimationsModule],
      providers: [provideRouter([]), { provide: AdminApiService, useValue: adminApiSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    dialog = TestBed.inject(MatDialog);
    snackBar = TestBed.inject(MatSnackBar);
    openDialogSpy = spyOn(dialog, 'open').and.returnValue({
      afterClosed: () => of(false)
    } as never);
    snackBarOpenSpy = spyOn(snackBar, 'open');
    (component as any).dialog = dialog;
    (component as any).snackBar = snackBar;
    fixture.detectChanges();
  });

  it('loads products and categories and renders product names', () => {
    expect(adminApiSpy.getProducts).toHaveBeenCalled();
    expect(adminApiSpy.getCategories).toHaveBeenCalled();
    expect((component as any).isLoading()).toBeFalse();
    expect((component as any).dataSource.data.length).toBe(2);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Microscope X1');
    expect(text).toContain('Centrifuge Pro');
  });

  it('filters visible rows by search query', () => {
    (component as any).onSearchChange('centrif');
    fixture.detectChanges();
    expect((component as any).dataSource.filteredData.map((p: ProductDto) => p.slug)).toEqual(['centrifuge-pro']);

    (component as any).clearSearch();
    fixture.detectChanges();
    expect((component as any).dataSource.filteredData.length).toBe(2);
  });

  it('shows a message when bulk availability is requested with no selection', () => {
    (component as any).bulkSetAvailability(true);
    expect(snackBarOpenSpy).toHaveBeenCalledWith('Select at least one product.', 'Dismiss', { duration: 4000 });
    expect(adminApiSpy.bulkSetProductAvailability).not.toHaveBeenCalled();
  });

  it('calls bulkSetProductAvailability when rows are selected', () => {
    adminApiSpy.bulkSetProductAvailability.and.returnValue(
      of({ requestedCount: 1, processedCount: 1, notFoundCount: 0 })
    );

    (component as any).toggleRowSelection(productA.id, true);
    (component as any).bulkSetAvailability(true);

    expect(adminApiSpy.bulkSetProductAvailability).toHaveBeenCalledWith({
      productIds: [productA.id],
      isAvailable: true
    });
    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Marked 1/1 product(s) as available.',
      'Dismiss',
      jasmine.objectContaining({ duration: 5000 })
    );
    expect(adminApiSpy.getProducts).toHaveBeenCalledTimes(2);
  });

  it('bulk deletes after confirmation and refreshes the list', () => {
    openDialogSpy.and.returnValue({
      afterClosed: () => of(true)
    } as never);

    (component as any).toggleRowSelection(productA.id, true);
    (component as any).toggleRowSelection(productB.id, true);
    (component as any).bulkDeleteSelected();

    expect(openDialogSpy).toHaveBeenCalled();
    expect(adminApiSpy.bulkDeleteProducts).toHaveBeenCalledWith({
      productIds: [productA.id, productB.id]
    });
    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Processed 2/2 product(s).',
      'Dismiss',
      jasmine.objectContaining({ duration: 5000 })
    );
    expect(adminApiSpy.getProducts).toHaveBeenCalledTimes(2);
  });

  it('exports CSV via the API', () => {
    const createSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:mock');
    const revokeSpy = spyOn(URL, 'revokeObjectURL');

    (component as any).exportSelected();

    expect(adminApiSpy.exportProducts).toHaveBeenCalledWith(undefined);
    expect(createSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith('blob:mock');
    expect(snackBarOpenSpy).toHaveBeenCalledWith('Export completed.', 'Dismiss', { duration: 3500 });
  });

  it('passes selected ids to export when rows are selected', () => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:mock');
    spyOn(URL, 'revokeObjectURL');

    (component as any).toggleRowSelection(productA.id, true);
    (component as any).exportSelected();

    expect(adminApiSpy.exportProducts).toHaveBeenCalledWith([productA.id]);
  });

  it('imports CSV and refreshes the list', () => {
    const file = new File(['x'], 'import.csv', { type: 'text/csv' });
    const event = { target: { files: [file], value: 'import.csv' } } as unknown as Event;

    (component as any).importProducts(event);

    expect(adminApiSpy.importProducts).toHaveBeenCalledWith(file);
    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Import complete: 0 added, 0 updated, 0 failed.',
      'Dismiss',
      { duration: 8000 }
    );
    expect(adminApiSpy.getProducts).toHaveBeenCalledTimes(2);
  });

  it('shows bulk delete error when API fails', () => {
    openDialogSpy.and.returnValue({
      afterClosed: () => of(true)
    } as never);
    adminApiSpy.bulkDeleteProducts.and.returnValue(
      throwError(() => new ApiError(400, 'Bulk delete failed.'))
    );

    (component as any).toggleRowSelection(productA.id, true);
    (component as any).bulkDeleteSelected();

    expect(snackBarOpenSpy).toHaveBeenCalledWith('Bulk delete failed.', 'Dismiss', { duration: 8000 });
  });
});
