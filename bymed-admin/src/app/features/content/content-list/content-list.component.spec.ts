import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { PageContentSummaryDto, PagedResultDto } from '@shared/models';
import { ContentListComponent } from './content-list.component';

describe('ContentListComponent', () => {
  let fixture: ComponentFixture<ContentListComponent>;
  let component: ContentListComponent;
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
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads content pages and renders title, slug, and status', () => {
    expect(adminApiSpy.getContentPages).toHaveBeenCalledWith(1, 100);
    expect((component as unknown as { isLoading: () => boolean }).isLoading()).toBeFalse();
    expect((component as unknown as { dataSource: { data: unknown[] } }).dataSource.data.length).toBe(1);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('About Us');
    expect(text).toContain('about');
    expect(text).toContain('Published');
  });

  it('filters rows by search query', () => {
    (component as unknown as { onSearchChange: (v: string) => void }).onSearchChange('services');
    fixture.detectChanges();
    expect((component as unknown as { dataSource: { filteredData: unknown[] } }).dataSource.filteredData.length).toBe(
      0
    );

    (component as unknown as { onSearchChange: (v: string) => void }).onSearchChange('about');
    fixture.detectChanges();
    expect((component as unknown as { dataSource: { filteredData: unknown[] } }).dataSource.filteredData.length).toBe(
      1
    );

    (component as unknown as { clearSearch: () => void }).clearSearch();
    fixture.detectChanges();
    expect((component as unknown as { dataSource: { filteredData: unknown[] } }).dataSource.filteredData.length).toBe(
      1
    );
  });

  it('shows error when the API fails', () => {
    adminApiSpy.getContentPages.and.returnValue(throwError(() => new Error('network')));

    fixture = TestBed.createComponent(ContentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(
      (component as unknown as { errorMessage: () => string | null }).errorMessage()
    ).toBe('Content pages could not be loaded. Please try again.');
  });

  it('lastActivityIso prefers publishedAt over creationTime', () => {
    const iso = (component as unknown as { lastActivityIso: (r: PageContentSummaryDto) => string }).lastActivityIso(
      pageRow
    );
    expect(iso).toBe(pageRow.publishedAt as string);
  });
});
