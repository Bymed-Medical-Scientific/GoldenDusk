import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { PageContentSummaryDto, PagedResultDto } from '@shared/models';
import { ContentListComponent } from './content-list.component';

type ContentListHarness = ContentListComponent & {
  isLoading: () => boolean;
  filteredPages: () => unknown[];
  onSearchChange: (v: string) => void;
  clearSearch: () => void;
  onStatusTabChange: (v: 'all' | 'published' | 'draft') => void;
  errorMessage: () => string | null;
  lastActivityIso: (r: PageContentSummaryDto) => string;
};

describe('ContentListComponent', () => {
  let fixture: ComponentFixture<ContentListComponent>;
  let component: ContentListHarness;
  let adminApiSpy: jasmine.SpyObj<AdminApiService>;

  const pageRow: PageContentSummaryDto = {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    slug: 'about',
    title: 'About Us',
    content: '<p>Hello</p>',
    metadata: {},
    isPublished: true,
    publishedAt: '2026-01-10T12:00:00.000Z',
    creationTime: '2025-06-01T08:00:00.000Z'
  };

  const paged: PagedResultDto<PageContentSummaryDto> = {
    items: [pageRow],
    pageNumber: 1,
    pageSize: 100,
    totalCount: 1,
    totalPages: 1
  };

  beforeEach(async () => {
    adminApiSpy = jasmine.createSpyObj<AdminApiService>('AdminApiService', [
      'getContentPages',
      'deletePageContent'
    ]);
    adminApiSpy.getContentPages.and.returnValue(of(paged));

    await TestBed.configureTestingModule({
      imports: [ContentListComponent, NoopAnimationsModule],
      providers: [provideRouter([]), { provide: AdminApiService, useValue: adminApiSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(ContentListComponent);
    component = fixture.componentInstance as ContentListHarness;
    fixture.detectChanges();
  });

  it('loads content pages and renders title, slug, and status', () => {
    expect(adminApiSpy.getContentPages).toHaveBeenCalledWith(1, 100);
    expect(component.isLoading()).toBeFalse();
    expect(component.filteredPages().length).toBe(1);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('About Us');
    expect(text).toContain('about');
    expect(text).toContain('Published');
  });

  it('filters rows by search query', () => {
    component.onSearchChange('services');
    fixture.detectChanges();
    expect(component.filteredPages().length).toBe(0);

    component.onSearchChange('about');
    fixture.detectChanges();
    expect(component.filteredPages().length).toBe(1);

    component.clearSearch();
    fixture.detectChanges();
    expect(component.filteredPages().length).toBe(1);
  });

  it('filters rows by publish status tab', () => {
    component.onStatusTabChange('draft');
    fixture.detectChanges();
    expect(component.filteredPages().length).toBe(0);

    component.onStatusTabChange('published');
    fixture.detectChanges();
    expect(component.filteredPages().length).toBe(1);
  });

  it('shows error when the API fails', () => {
    adminApiSpy.getContentPages.and.returnValue(throwError(() => new Error('network')));

    fixture = TestBed.createComponent(ContentListComponent);
    component = fixture.componentInstance as ContentListHarness;
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Content pages could not be loaded. Please try again.');
  });

  it('lastActivityIso prefers publishedAt over creationTime', () => {
    expect(component.lastActivityIso(pageRow)).toBe(pageRow.publishedAt as string);
  });
});
