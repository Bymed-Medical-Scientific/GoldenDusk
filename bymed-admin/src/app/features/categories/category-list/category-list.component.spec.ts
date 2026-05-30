import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { CategoryDto } from '@shared/models';
import { CategoryListComponent } from './category-list.component';

describe('CategoryListComponent', () => {
  let fixture: ComponentFixture<CategoryListComponent>;
  let component: CategoryListComponent;
  let adminApiSpy: jasmine.SpyObj<AdminApiService>;

  const categories: CategoryDto[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Imaging',
      slug: 'imaging',
      description: 'Imaging products',
      displayOrder: 2
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Diagnostics',
      slug: 'diagnostics',
      description: 'Diagnostics products',
      displayOrder: 1
    }
  ];

  beforeEach(async () => {
    adminApiSpy = jasmine.createSpyObj<AdminApiService>('AdminApiService', ['getCategories', 'deleteCategory']);
    adminApiSpy.getCategories.and.returnValue(of(categories));

    await TestBed.configureTestingModule({
      imports: [CategoryListComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AdminApiService, useValue: adminApiSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads and renders categories on init', () => {
    expect(adminApiSpy.getCategories).toHaveBeenCalledTimes(1);
    expect((component as any).categories().length).toBe(2);
    expect((component as any).isLoading()).toBeFalse();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Imaging');
    expect(text).toContain('Diagnostics');
  });

  it('filters categories by search query', () => {
    (component as any).onSearchChange('diag');
    fixture.detectChanges();
    expect((component as any).filteredCategories().map((x: CategoryDto) => x.slug)).toEqual(['diagnostics']);

    (component as any).clearSearch();
    fixture.detectChanges();
    expect((component as any).filteredCategories().length).toBe(2);
  });

  it('deletes a category after confirmation and refreshes list', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    adminApiSpy.deleteCategory.and.returnValue(of(void 0));

    (component as any).deleteCategory(categories[0]);

    expect(adminApiSpy.deleteCategory).toHaveBeenCalledWith(categories[0].id);
    expect(adminApiSpy.getCategories).toHaveBeenCalledTimes(2);
    expect((component as any).pageMessage()).toBe('Category deleted successfully.');
  });

  it('shows delete error when API fails', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    adminApiSpy.deleteCategory.and.returnValue(
      throwError(() => new ApiError(400, 'Cannot delete category with assigned products.'))
    );

    (component as any).deleteCategory(categories[0]);

    expect((component as any).pageMessage()).toBe('Could not delete the category. Please try again.');
  });
});
