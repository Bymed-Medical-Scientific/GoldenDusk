import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { CategoryDto } from '@shared/models';
import { CategoryFormComponent } from './category-form.component';

describe('CategoryFormComponent', () => {
  let fixture: ComponentFixture<CategoryFormComponent>;
  let component: CategoryFormComponent;
  let adminApiSpy: jasmine.SpyObj<AdminApiService>;
  let router: Router;

  const category: CategoryDto = {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Laboratory',
    slug: 'laboratory',
    description: 'Lab category',
    displayOrder: 4
  };

  async function setup(categoryId: string | null = null): Promise<void> {
    adminApiSpy = jasmine.createSpyObj<AdminApiService>('AdminApiService', [
      'getCategoryById',
      'createCategory',
      'updateCategory'
    ]);
    adminApiSpy.getCategoryById.and.returnValue(of(category));
    adminApiSpy.createCategory.and.returnValue(of(category));
    adminApiSpy.updateCategory.and.returnValue(of(category));

    await TestBed.configureTestingModule({
      imports: [CategoryFormComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AdminApiService, useValue: adminApiSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(categoryId ? { id: categoryId } : {})
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  }

  it('does not submit invalid form and exposes validation errors', async () => {
    await setup();

    (component as any).categoryForm.patchValue({
      name: '',
      slug: 'INVALID Slug',
      displayOrder: -1
    });

    (component as any).submit();

    expect(adminApiSpy.createCategory).not.toHaveBeenCalled();
    expect((component as any).fieldError('name')).toBe('Name is required.');
    expect((component as any).fieldError('slug')).toContain('URL-safe slug');
    expect((component as any).fieldError('displayOrder')).toBe('Display order must be zero or greater.');
  });

  it('creates a category with trimmed values', async () => {
    await setup();

    (component as any).categoryForm.patchValue({
      name: '  Surgical  ',
      slug: 'surgical',
      description: '  Instruments and devices  ',
      displayOrder: 3
    });

    (component as any).submit();

    expect(adminApiSpy.createCategory).toHaveBeenCalledWith({
      name: 'Surgical',
      slug: 'surgical',
      description: 'Instruments and devices',
      displayOrder: 3
    });
    expect(router.navigate).toHaveBeenCalledWith(['/categories']);
  });

  it('loads existing category in edit mode and updates it', async () => {
    await setup(category.id);

    expect(adminApiSpy.getCategoryById).toHaveBeenCalledWith(category.id);
    expect((component as any).categoryForm.getRawValue().name).toBe('Laboratory');

    (component as any).categoryForm.patchValue({
      name: 'Updated Name',
      slug: 'updated-name',
      description: '',
      displayOrder: 8
    });
    (component as any).submit();

    expect(adminApiSpy.updateCategory).toHaveBeenCalledWith(category.id, {
      name: 'Updated Name',
      slug: 'updated-name',
      description: undefined,
      displayOrder: 8
    });
    expect(router.navigate).toHaveBeenCalledWith(['/categories']);
  });

  it('maps server validation errors onto fields', async () => {
    await setup();
    adminApiSpy.createCategory.and.returnValue(
      throwError(
        () =>
          new ApiError(400, 'Validation failed', null, [
            { propertyName: 'Slug', errorMessage: 'Slug already exists.' }
          ])
      )
    );

    (component as any).categoryForm.patchValue({
      name: 'Category',
      slug: 'category',
      description: '',
      displayOrder: 0
    });
    (component as any).submit();

    expect((component as any).fieldError('slug')).toBe('Slug already exists.');
    expect((component as any).generalError()).toBeNull();
  });
});
