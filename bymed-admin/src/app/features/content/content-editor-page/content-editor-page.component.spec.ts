import { HttpResponse } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { ContentImageUploadDto, PageContentSummaryDto } from '@shared/models';
import { ContentEditorPageComponent } from './content-editor-page.component';

describe('ContentEditorPageComponent', () => {
  let fixture: ComponentFixture<ContentEditorPageComponent>;
  let component: ContentEditorPageComponent;
  let adminApiSpy: jasmine.SpyObj<AdminApiService>;
  let router: Router;
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const pageDto: PageContentSummaryDto = {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    slug: 'about',
    title: 'About',
    content: '<p>Body</p>',
    metadata: { metaTitle: 'T', metaDescription: 'D', ogImage: null },
    isPublished: true,
    publishedAt: '2026-01-01T00:00:00.000Z',
    creationTime: '2025-01-01T00:00:00.000Z'
  };

  async function setupEditor(): Promise<void> {
    paramMap$ = new BehaviorSubject(convertToParamMap({ slug: 'about' }));

    adminApiSpy = jasmine.createSpyObj<AdminApiService>('AdminApiService', [
      'getPageContentBySlug',
      'updatePageContent',
      'uploadContentImageWithProgress'
    ]);
    adminApiSpy.getPageContentBySlug.and.returnValue(of(pageDto));
    adminApiSpy.updatePageContent.and.returnValue(of(pageDto));
    const uploadDto: ContentImageUploadDto = { url: 'https://cdn.example/x.png', fileName: 'x.png' };
    adminApiSpy.uploadContentImageWithProgress.and.returnValue(of(new HttpResponse({ body: uploadDto })));

    await TestBed.configureTestingModule({
      imports: [ContentEditorPageComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AdminApiService, useValue: adminApiSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$.asObservable(),
            data: of({ contentEditorMode: 'edit' as const }),
            snapshot: {
              data: { contentEditorMode: 'edit' },
              paramMap: convertToParamMap({ slug: 'about' })
            }
          }
        }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(TestBed.inject(DomSanitizer), 'bypassSecurityTrustHtml').and.callFake((html: string) => html as never);

    fixture = TestBed.createComponent(ContentEditorPageComponent);
    component = fixture.componentInstance;
  }

  beforeEach(async () => {
    await setupEditor();
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('loads page by slug and patches the form', () => {
    expect(adminApiSpy.getPageContentBySlug).toHaveBeenCalledWith('about');
    expect((component as unknown as { isInitializing: () => boolean }).isInitializing()).toBeFalse();
    const title = (component as unknown as { pageForm: { controls: { title: { value: string } } } }).pageForm.controls
      .title.value;
    expect(title).toBe('About');
    expect(
      (component as unknown as { pageForm: { controls: { isPublished: { value: boolean } } } }).pageForm.controls
        .isPublished.value
    ).toBeTrue();
  });

  it('does not call update when the form is invalid', () => {
    (component as unknown as { pageForm: { patchValue: (v: { title: string }) => void } }).pageForm.patchValue({
      title: ''
    });
    (component as unknown as { save: () => void }).save();

    expect(adminApiSpy.updatePageContent).not.toHaveBeenCalled();
  });

  it('saves with publishState and metadata', async () => {
    (component as unknown as { pageForm: { patchValue: (v: Record<string, unknown>) => void } }).pageForm.patchValue({
      title: 'About v2',
      slug: 'about',
      content: '<p>Body</p>',
      metaTitle: ' SEO ',
      metaDescription: '',
      ogImage: '',
      isPublished: false
    });

    (component as unknown as { save: () => void }).save();
    await fixture.whenStable();

    expect(adminApiSpy.updatePageContent).toHaveBeenCalledWith('about', {
      slug: 'about',
      title: 'About v2',
      content: '<p>Body</p>',
      metadata: {
        metaTitle: 'SEO',
        metaDescription: null,
        ogImage: null
      },
      publishState: false
    });
  });

  it('navigates when slug changes after save', async () => {
    adminApiSpy.updatePageContent.and.returnValue(
      of({
        ...pageDto,
        slug: 'about-us',
        title: 'About v2',
        content: '<p>x</p>'
      })
    );

    (component as unknown as { pageForm: { patchValue: (v: { slug: string }) => void } }).pageForm.patchValue({
      slug: 'about-us'
    });
    (component as unknown as { save: () => void }).save();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/content', 'about-us', 'edit']);
  });

  it('toggles preview mode', () => {
    (component as unknown as { setPreview: (v: boolean) => void }).setPreview(true);
    expect((component as unknown as { isPreview: () => boolean }).isPreview()).toBeTrue();

    (component as unknown as { setPreview: (v: boolean) => void }).setPreview(false);
    expect((component as unknown as { isPreview: () => boolean }).isPreview()).toBeFalse();
  });
});

describe('ContentEditorPageComponent (not found)', () => {
  it('sets init error when page is not found', async () => {
    const paramMap$ = new BehaviorSubject(convertToParamMap({ slug: 'missing' }));

    const adminApiSpy = jasmine.createSpyObj<AdminApiService>('AdminApiService', [
      'getPageContentBySlug',
      'updatePageContent',
      'uploadContentImageWithProgress'
    ]);
    adminApiSpy.getPageContentBySlug.and.returnValue(throwError(() => new ApiError(404, 'Not found')));

    await TestBed.configureTestingModule({
      imports: [ContentEditorPageComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AdminApiService, useValue: adminApiSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$.asObservable(),
            data: of({ contentEditorMode: 'edit' as const }),
            snapshot: {
              data: { contentEditorMode: 'edit' },
              paramMap: convertToParamMap({ slug: 'missing' })
            }
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(ContentEditorPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      (fixture.componentInstance as unknown as { initError: () => string | null }).initError()
    ).toBe('This page was not found.');
  });
});
