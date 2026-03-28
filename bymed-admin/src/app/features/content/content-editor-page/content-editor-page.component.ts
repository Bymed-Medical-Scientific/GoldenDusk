import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { QuillEditorComponent } from 'ngx-quill';
import Quill from 'quill';
import { catchError, distinctUntilChanged, EMPTY, filter, finalize, map, switchMap } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { PageLoadingComponent } from '@shared/components/page-loading/page-loading.component';
import { PageContentSummaryDto } from '@shared/models';

const TITLE_MAX_LENGTH = 500;
const SLUG_MAX_LENGTH = 200;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CONTENT_MAX_HTML_LENGTH = 200_000;
const META_TITLE_MAX = 100;
const META_DESCRIPTION_MAX = 300;
const OG_IMAGE_MAX = 2000;

function isHtmlContentEmpty(html: string): boolean {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length === 0;
}

function nonEmptyHtmlValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value?.toString() ?? '';
  return isHtmlContentEmpty(value) ? { required: true } : null;
}

@Component({
  selector: 'app-content-editor-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    GlobalErrorComponent,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    PageLoadingComponent,
    QuillEditorComponent
  ],
  templateUrl: './content-editor-page.component.html',
  styleUrl: './content-editor-page.component.scss'
})
export class ContentEditorPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminApi = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('quillImageInput') private quillImageInput?: ElementRef<HTMLInputElement>;
  @ViewChild('ogImageInput') private ogImageInput?: ElementRef<HTMLInputElement>;

  private quillInstance: Quill | null = null;
  /** Slug used in the current `GET` / `PUT` URL (updates after a successful slug rename). */
  private lookupSlug = '';

  protected readonly isInitializing = signal(true);
  protected readonly initError = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly pageError = signal<string | null>(null);
  protected readonly isPreview = signal(false);
  protected readonly isUploadingQuillImage = signal(false);
  protected readonly isUploadingOgImage = signal(false);

  protected readonly contentQuillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ header: [1, 2, 3, false] }],
      ['link', 'image', 'clean']
    ]
  };

  protected readonly pageForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(TITLE_MAX_LENGTH)]],
    slug: [
      '',
      [Validators.required, Validators.maxLength(SLUG_MAX_LENGTH), Validators.pattern(SLUG_PATTERN)]
    ],
    content: ['', [nonEmptyHtmlValidator, Validators.maxLength(CONTENT_MAX_HTML_LENGTH)]],
    metaTitle: ['', [Validators.maxLength(META_TITLE_MAX)]],
    metaDescription: ['', [Validators.maxLength(META_DESCRIPTION_MAX)]],
    ogImage: ['', [Validators.maxLength(OG_IMAGE_MAX)]],
    isPublished: [false]
  });

  public ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((p) => p.get('slug')),
        filter((s): s is string => !!s),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
        switchMap((slug) => {
          this.lookupSlug = slug;
          this.initError.set(null);
          this.pageError.set(null);
          this.isInitializing.set(true);
          this.isPreview.set(false);
          return this.adminApi.getPageContentBySlug(slug).pipe(
            catchError((err: unknown) => {
              if (err instanceof ApiError && err.statusCode === 404) {
                this.initError.set('This page was not found.');
              } else {
                this.initError.set('The page could not be loaded. Please try again.');
              }
              return EMPTY;
            }),
            finalize(() => this.isInitializing.set(false))
          );
        })
      )
      .subscribe((page) => this.patchFromPage(page));
  }

  protected onContentEditorCreated(quill: Quill): void {
    this.quillInstance = quill;
    const toolbar = quill.getModule('toolbar') as { addHandler: (name: string, fn: () => void) => void };
    toolbar.addHandler('image', () => this.openQuillImagePicker());
  }

  protected setPreview(on: boolean): void {
    this.isPreview.set(on);
    if (on) {
      this.quillInstance = null;
    }
  }

  protected trustedPreviewHtml(): SafeHtml {
    const html = this.pageForm.controls.content.value;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  protected openQuillImagePicker(): void {
    const el = this.quillImageInput?.nativeElement;
    if (!el) {
      return;
    }
    el.value = '';
    el.click();
  }

  protected onQuillImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.quillInstance) {
      return;
    }

    this.isUploadingQuillImage.set(true);
    this.adminApi
      .uploadContentImage(file)
      .pipe(
        catchError((err: unknown) => {
          const msg = err instanceof ApiError ? err.message : 'Image upload failed.';
          this.snackBar.open(msg, 'Dismiss', { duration: 8000 });
          return EMPTY;
        }),
        finalize(() => this.isUploadingQuillImage.set(false))
      )
      .subscribe((res) => {
        const range = this.quillInstance?.getSelection(true);
        const index = range?.index ?? this.quillInstance?.getLength() ?? 0;
        this.quillInstance?.insertEmbed(index, 'image', res.url, 'user');
        this.quillInstance?.setSelection(index + 1, 0);
      });
  }

  protected openOgImagePicker(): void {
    const el = this.ogImageInput?.nativeElement;
    if (!el) {
      return;
    }
    el.value = '';
    el.click();
  }

  protected onOgImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.isUploadingOgImage.set(true);
    this.adminApi
      .uploadContentImage(file)
      .pipe(
        catchError((err: unknown) => {
          const msg = err instanceof ApiError ? err.message : 'Image upload failed.';
          this.snackBar.open(msg, 'Dismiss', { duration: 8000 });
          return EMPTY;
        }),
        finalize(() => this.isUploadingOgImage.set(false))
      )
      .subscribe((res) => {
        this.pageForm.patchValue({ ogImage: res.url });
        this.snackBar.open('OG image URL set from upload.', 'Dismiss', { duration: 4000 });
      });
  }

  protected discardChanges(): void {
    if (!this.lookupSlug) {
      return;
    }
    this.pageError.set(null);
    this.isInitializing.set(true);
    this.adminApi
      .getPageContentBySlug(this.lookupSlug)
      .pipe(
        catchError(() => {
          this.snackBar.open('Could not reload the page.', 'Dismiss', { duration: 6000 });
          return EMPTY;
        }),
        finalize(() => this.isInitializing.set(false))
      )
      .subscribe((page) => this.patchFromPage(page));
  }

  protected save(): void {
    this.pageError.set(null);

    if (this.pageForm.invalid || this.isSubmitting() || !this.lookupSlug) {
      this.pageForm.markAllAsTouched();
      return;
    }

    const raw = this.pageForm.getRawValue();
    const body = {
      slug: raw.slug.trim(),
      title: raw.title.trim(),
      content: raw.content,
      metadata: {
        metaTitle: raw.metaTitle.trim() ? raw.metaTitle.trim() : null,
        metaDescription: raw.metaDescription.trim() ? raw.metaDescription.trim() : null,
        ogImage: raw.ogImage.trim() ? raw.ogImage.trim() : null
      },
      publishState: raw.isPublished
    };

    this.isSubmitting.set(true);
    this.adminApi
      .updatePageContent(this.lookupSlug, body)
      .pipe(
        catchError((err: unknown) => {
          if (err instanceof ApiError) {
            if (err.validationErrors?.length) {
              this.pageError.set(err.validationErrors.map((e) => e.errorMessage).join(' '));
            } else {
              this.pageError.set(err.message);
            }
            this.snackBar.open(err.message, 'Dismiss', { duration: 8000 });
          } else {
            this.pageError.set('Could not save the page. Please try again.');
            this.snackBar.open('Could not save the page.', 'Dismiss', { duration: 8000 });
          }
          return EMPTY;
        }),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe((updated) => {
        this.snackBar.open('Page saved.', 'Dismiss', { duration: 4000 });
        if (updated.slug !== this.lookupSlug) {
          void this.router.navigate(['/content', updated.slug, 'edit']);
        } else {
          this.patchFromPage(updated);
        }
      });
  }

  private patchFromPage(page: PageContentSummaryDto): void {
    this.pageForm.patchValue({
      title: page.title,
      slug: page.slug,
      content: page.content,
      metaTitle: page.metadata?.metaTitle ?? '',
      metaDescription: page.metadata?.metaDescription ?? '',
      ogImage: page.metadata?.ogImage ?? '',
      isPublished: page.isPublished
    });
    this.pageForm.markAsPristine();
  }
}
