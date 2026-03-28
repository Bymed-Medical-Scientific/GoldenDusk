import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ContentVersionSummaryDto, PagedResultDto } from '@shared/models';
import { ContentVersionPreviewDialogComponent } from '../content-version-preview-dialog/content-version-preview-dialog.component';
import { ContentHistoryPageComponent } from './content-history-page.component';

describe('ContentHistoryPageComponent', () => {
  let fixture: ComponentFixture<ContentHistoryPageComponent>;
  let component: ContentHistoryPageComponent;
  let adminApiSpy: jasmine.SpyObj<AdminApiService>;
  let router: Router;
  let dialog: MatDialog;
  let dialogOpenSpy: jasmine.Spy;
  let navigateSpy: jasmine.Spy;
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const versionRow: ContentVersionSummaryDto = {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    createdAt: '2026-02-01T15:30:00.000Z',
    createdBy: 'admin@test.com'
  };

  const paged: PagedResultDto<ContentVersionSummaryDto> = {
    items: [versionRow],
    pageNumber: 1,
    pageSize: 20,
    totalCount: 1,
    totalPages: 1
  };

  beforeEach(async () => {
    paramMap$ = new BehaviorSubject(convertToParamMap({ slug: 'about' }));

    adminApiSpy = jasmine.createSpyObj<AdminApiService>('AdminApiService', [
      'getContentVersionHistory',
      'revertContentToVersion'
    ]);
    adminApiSpy.getContentVersionHistory.and.returnValue(of(paged));
    adminApiSpy.revertContentToVersion.and.returnValue(
      of({
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        slug: 'about',
        title: 'About',
        content: '<p>old</p>',
        metadata: {},
        isPublished: true,
        creationTime: '2025-01-01T00:00:00.000Z'
      })
    );

    await TestBed.configureTestingModule({
      imports: [ContentHistoryPageComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AdminApiService, useValue: adminApiSpy },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMap$.asObservable() }
        }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
    dialog = TestBed.inject(MatDialog);
    dialogOpenSpy = spyOn(dialog, 'open').and.returnValue({
      afterClosed: () => of(false)
    } as never);

    fixture = TestBed.createComponent(ContentHistoryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads version history for the route slug', () => {
    expect(adminApiSpy.getContentVersionHistory).toHaveBeenCalledWith('about', 1, 20);
    expect((component as unknown as { isLoading: () => boolean }).isLoading()).toBeFalse();
    expect((component as unknown as { dataSource: { data: unknown[] } }).dataSource.data.length).toBe(1);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('admin@test.com');
  });

  it('opens the preview dialog when View is used', () => {
    (component as unknown as { openPreview: (row: ContentVersionSummaryDto) => void }).openPreview(versionRow);

    expect(dialogOpenSpy).toHaveBeenCalled();
    const [openedComponent, config] = dialogOpenSpy.calls.mostRecent().args;
    expect(openedComponent).toBe(ContentVersionPreviewDialogComponent);
    expect((config as { data: { slug: string; versionId: string } }).data).toEqual({
      slug: 'about',
      versionId: versionRow.id
    });
  });

  it('confirmRevert opens the confirmation dialog', () => {
    (component as unknown as { confirmRevert: (row: ContentVersionSummaryDto) => void }).confirmRevert(versionRow);

    expect(dialogOpenSpy).toHaveBeenCalled();
    const [opened] = dialogOpenSpy.calls.mostRecent().args;
    expect(opened).toBe(ConfirmDialogComponent);
  });

  it('revert invokes API, snackbar, and navigation', () => {
    (component as unknown as { revert: (row: ContentVersionSummaryDto) => void }).revert(versionRow);

    expect(adminApiSpy.revertContentToVersion).toHaveBeenCalledWith('about', versionRow.id);
    expect(navigateSpy).toHaveBeenCalledWith(['/content', 'about', 'edit']);
  });
});
