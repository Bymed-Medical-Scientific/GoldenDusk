import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { LowStockAlertsService } from '@core/inventory/low-stock-alerts.service';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { ApiError } from '@core/api/api-error';
import { CategoryDto, ProductDto, ProductImageDto } from '@shared/models';
import { ProductFormComponent } from './product-form.component';

describe('ProductFormComponent', () => {
  let fixture: ComponentFixture<ProductFormComponent>;
  let component: ProductFormComponent;
  let adminApiSpy: jasmine.SpyObj<AdminApiService>;
  let router: Router;

  const category: CategoryDto = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Imaging',
    slug: 'imaging',
    description: 'Imaging',
    displayOrder: 1
  };

  const createdProduct: ProductDto = {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    name: 'New Product',
    slug: 'new-product',
    description: '<p>Hello</p>',
    categoryId: category.id,
    categoryName: category.name,
    price: 10,
    currency: 'USD',
    inventoryCount: 3,
    lowStockThreshold: 1,
    isAvailable: true
  };

  const uploadedImage: ProductImageDto = {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    productId: createdProduct.id,
    url: '/media/x.png',
    altText: 'New Product',
    displayOrder: 0
  };

  async function setup(productId: string | null = null): Promise<void> {
    const lowStockSpy = jasmine.createSpyObj<LowStockAlertsService>('LowStockAlertsService', ['refresh']);

    adminApiSpy = jasmine.createSpyObj<AdminApiService>('AdminApiService', [
      'getCategories',
      'getProductById',
      'createProduct',
      'updateProduct',
      'uploadProductImage'
    ]);
    adminApiSpy.getCategories.and.returnValue(of([category]));
    adminApiSpy.createProduct.and.returnValue(of(createdProduct));
    adminApiSpy.uploadProductImage.and.returnValue(of(uploadedImage));

    await TestBed.configureTestingModule({
      imports: [ProductFormComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AdminApiService, useValue: adminApiSpy },
        { provide: LowStockAlertsService, useValue: lowStockSpy },
        { provide: API_BASE_URL, useValue: 'http://localhost:5000' },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(productId ? { id: productId } : {})
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  }

  it('does not submit an invalid form and exposes validation messages', async () => {
    await setup();

    (component as any).productForm.patchValue({
      name: '',
      slug: 'Bad Slug',
      description: '',
      categoryId: '',
      price: -1,
      currency: 'US',
      inventoryCount: 0,
      lowStockThreshold: 0,
      sku: ''
    });

    (component as any).submit();

    expect(adminApiSpy.createProduct).not.toHaveBeenCalled();
    expect((component as any).fieldError('name')).toBe('Name is required.');
    expect((component as any).fieldError('slug')).toContain('URL-safe slug');
    expect((component as any).fieldError('description')).toBe('Description is required.');
    expect((component as any).fieldError('categoryId')).toBe('Category is required.');
    expect((component as any).fieldError('price')).toBe('Price cannot be negative.');
    expect((component as any).fieldError('currency')).toBe('Use a 3-letter currency code (e.g. USD).');
  });

  it('creates a product with valid payload and navigates to the list', async () => {
    await setup();

    (component as any).productForm.patchValue({
      name: '  New Product  ',
      slug: 'new-product',
      description: '<p>Hello world</p>',
      categoryId: category.id,
      price: 10,
      currency: 'USD',
      inventoryCount: 3,
      lowStockThreshold: 1,
      sku: ''
    });

    (component as any).submit();

    expect(adminApiSpy.createProduct).toHaveBeenCalledWith({
      name: 'New Product',
      slug: 'new-product',
      description: '<p>Hello world</p>',
      categoryId: category.id,
      price: 10,
      inventoryCount: 3,
      lowStockThreshold: 1,
      sku: undefined,
      currency: 'USD',
      specifications: undefined
    });
    expect(router.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('uploads a pending image after create', async () => {
    await setup();

    (component as any).productForm.patchValue({
      name: 'New Product',
      slug: 'new-product',
      description: '<p>Hello world</p>',
      categoryId: category.id,
      price: 10,
      currency: 'USD',
      inventoryCount: 3,
      lowStockThreshold: 1,
      sku: ''
    });

    const file = new File(['x'], 'photo.png', { type: 'image/png' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    (component as any).onImageSelected({ target: { files: dataTransfer.files } } as unknown as Event);

    (component as any).submit();

    expect(adminApiSpy.uploadProductImage).toHaveBeenCalledWith(createdProduct.id, file, 'New Product');
    expect(router.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('maps server validation errors onto fields', async () => {
    await setup();
    adminApiSpy.createProduct.and.returnValue(
      throwError(
        () =>
          new ApiError(400, 'Validation failed', null, [
            { propertyName: 'Slug', errorMessage: 'Slug already exists.' }
          ])
      )
    );

    (component as any).productForm.patchValue({
      name: 'New Product',
      slug: 'new-product',
      description: '<p>x</p>',
      categoryId: category.id,
      price: 10,
      currency: 'USD',
      inventoryCount: 3,
      lowStockThreshold: 1,
      sku: ''
    });
    (component as any).submit();

    expect((component as any).fieldError('slug')).toBe('Slug already exists.');
    expect((component as any).generalError()).toBeNull();
  });
});
