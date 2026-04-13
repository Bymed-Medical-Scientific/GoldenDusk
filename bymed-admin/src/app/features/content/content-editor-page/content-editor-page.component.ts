import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Data, Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { QuillEditorComponent } from 'ngx-quill';
import Quill from 'quill';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  filter,
  finalize,
  forkJoin,
  map,
  of,
  startWith,
  switchMap,
  tap
} from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { PageLoadingComponent } from '@shared/components/page-loading/page-loading.component';
import { ContentImageUploadDto, PageContentSummaryDto } from '@shared/models';
import { ProductDto } from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

const TITLE_MAX_LENGTH = 500;
const SLUG_MAX_LENGTH = 200;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CONTENT_MAX_HTML_LENGTH = 200_000;
const META_TITLE_MAX = 100;
const META_DESCRIPTION_MAX = 300;
const OG_IMAGE_MAX = 2000;
const HOME_FEATURED_PRODUCTS_LIMIT = 4;

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
    ButtonModule,
    ReactiveFormsModule,
    RouterLink,
    GlobalErrorComponent,
    InputTextModule,
    TextareaModule,
    MatDialogModule,
    MatSnackBarModule,
    PageLoadingComponent,
    ProgressBarModule,
    ProgressSpinnerModule,
    ToggleSwitchModule,
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
  private readonly dialog = inject(MatDialog);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  /** Route param slug (for links while editing). */
  protected readonly routeSlug = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('slug') ?? '')),
    { initialValue: '' }
  );

  protected readonly editorMode = toSignal(
    this.route.data.pipe(
      map((d: Data) => d['contentEditorMode'] as 'create' | 'edit' | undefined),
      startWith(this.route.snapshot.data['contentEditorMode'] as 'create' | 'edit' | undefined)
    ),
    { initialValue: this.route.snapshot.data['contentEditorMode'] as 'create' | 'edit' | undefined }
  );

  protected isCreateMode(): boolean {
    return this.editorMode() === 'create';
  }

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
  protected readonly quillUploadProgress = signal<number | null>(null);
  protected readonly ogUploadProgress = signal<number | null>(null);
  protected readonly featuredSearch = this.fb.nonNullable.control('');
  protected readonly featuredSearchResults = signal<ProductDto[]>([]);
  protected readonly selectedFeaturedProducts = signal<ProductDto[]>([]);
  protected readonly isSearchingFeaturedProducts = signal(false);
  protected readonly homeJsonError = signal<string | null>(null);

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
    this.pageForm.controls.slug.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncHomeFeaturedProductsFromContent());

    this.featuredSearch.valueChanges
      .pipe(
        startWith(this.featuredSearch.value),
        map((value) => value.trim()),
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!this.isHomeSlug() || term.length < 2) {
            this.isSearchingFeaturedProducts.set(false);
            return of<ProductDto[]>([]);
          }
          this.isSearchingFeaturedProducts.set(true);
          return this.adminApi.getProducts(1, 8, { search: term }).pipe(
            map((paged) => paged.items),
            catchError(() => of<ProductDto[]>([])),
            finalize(() => this.isSearchingFeaturedProducts.set(false))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((items) => this.featuredSearchResults.set(items));

    if (this.isCreateMode()) {
      this.lookupSlug = '';
      this.initError.set(null);
      this.pageError.set(null);
      this.isInitializing.set(false);
      this.isPreview.set(false);
      this.pageForm.reset({
        title: '',
        slug: '',
        content: '<p></p>',
        metaTitle: '',
        metaDescription: '',
        ogImage: '',
        isPublished: false
      });
      this.pageForm.markAsPristine();
      this.syncHomeFeaturedProductsFromContent();
      return;
    }

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

  protected isHomeSlug(): boolean {
    const slug = this.pageForm.controls.slug.value?.trim().toLowerCase() ?? '';
    const lookup = this.lookupSlug.trim().toLowerCase();
    return slug === 'home' || lookup === 'home';
  }

  protected homeJsonPreview(): string {
    const parsed = this.parseHomeContentObject();
    if (!parsed) {
      return this.pageForm.controls.content.value ?? '';
    }
    return JSON.stringify(parsed, null, 2);
  }

  protected addFeaturedProduct(product: ProductDto): void {
    const current = this.selectedFeaturedProducts();
    if (current.some((p) => p.id === product.id) || current.length >= HOME_FEATURED_PRODUCTS_LIMIT) {
      return;
    }
    this.selectedFeaturedProducts.set([...current, product]);
    this.persistSelectedFeaturedProducts();
  }

  protected removeFeaturedProduct(productId: string): void {
    const next = this.selectedFeaturedProducts().filter((p) => p.id !== productId);
    this.selectedFeaturedProducts.set(next);
    this.persistSelectedFeaturedProducts();
  }

  protected moveFeaturedProduct(index: number, direction: -1 | 1): void {
    const current = [...this.selectedFeaturedProducts()];
    const target = index + direction;
    if (target < 0 || target >= current.length) return;
    const [picked] = current.splice(index, 1);
    current.splice(target, 0, picked);
    this.selectedFeaturedProducts.set(current);
    this.persistSelectedFeaturedProducts();
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

  private parseHomeContentObject(): Record<string, unknown> | null {
    if (!this.isHomeSlug()) return null;
    const raw = this.pageForm.controls.content.value?.trim() ?? '';
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        this.homeJsonError.set(null);
        return parsed as Record<string, unknown>;
      }
      this.homeJsonError.set('Home content must be a JSON object.');
      return null;
    } catch {
      this.homeJsonError.set('Home content is not valid JSON.');
      return null;
    }
  }

  private readFeaturedIdsFromHomeContent(): string[] {
    const parsed = this.parseHomeContentObject();
    if (!parsed) return [];
    const value = parsed['featuredProductIds'];
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const item of value) {
      const id = typeof item === 'string' ? item.trim() : '';
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
    return ids.slice(0, HOME_FEATURED_PRODUCTS_LIMIT);
  }

  private persistSelectedFeaturedProducts(): void {
    if (!this.isHomeSlug()) return;
    const parsed = this.parseHomeContentObject();
    if (!parsed) return;
    parsed['featuredProductIds'] = this.selectedFeaturedProducts()
      .map((p) => p.id)
      .slice(0, HOME_FEATURED_PRODUCTS_LIMIT);
    this.pageForm.controls.content.setValue(JSON.stringify(parsed, null, 2));
    this.pageForm.controls.content.markAsDirty();
    this.pageForm.markAsDirty();
    this.homeJsonError.set(null);
  }

  private syncHomeFeaturedProductsFromContent(): void {
    if (!this.isHomeSlug()) {
      this.selectedFeaturedProducts.set([]);
      this.featuredSearchResults.set([]);
      this.homeJsonError.set(null);
      return;
    }
    const ids = this.readFeaturedIdsFromHomeContent();
    if (ids.length === 0) {
      this.selectedFeaturedProducts.set([]);
      return;
    }
    forkJoin(
      ids.map((id) =>
        this.adminApi.getProductById(id).pipe(catchError(() => of<ProductDto | null>(null)))
      )
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((products) => {
        const byId = new Map(products.filter((p): p is ProductDto => Boolean(p)).map((p) => [p.id, p]));
        const ordered = ids.map((id) => byId.get(id)).filter((p): p is ProductDto => Boolean(p));
        this.selectedFeaturedProducts.set(ordered);
      });
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
    this.quillUploadProgress.set(0);
    this.adminApi
      .uploadContentImageWithProgress(file)
      .pipe(
        tap((event) => {
          if (event.type === HttpEventType.UploadProgress && event.total && event.total > 0) {
            this.quillUploadProgress.set(Math.round((100 * event.loaded) / event.total));
          }
        }),
        filter((e): e is HttpResponse<ContentImageUploadDto> => e.type === HttpEventType.Response),
        map((e) => e.body!),
        catchError((err: unknown) => {
          const msg = err instanceof ApiError ? err.message : 'Image upload failed.';
          this.snackBar.open(msg, 'Dismiss', { duration: 8000 });
          return EMPTY;
        }),
        finalize(() => {
          this.isUploadingQuillImage.set(false);
          this.quillUploadProgress.set(null);
        })
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
    this.ogUploadProgress.set(0);
    this.adminApi
      .uploadContentImageWithProgress(file)
      .pipe(
        tap((event) => {
          if (event.type === HttpEventType.UploadProgress && event.total && event.total > 0) {
            this.ogUploadProgress.set(Math.round((100 * event.loaded) / event.total));
          }
        }),
        filter((e): e is HttpResponse<ContentImageUploadDto> => e.type === HttpEventType.Response),
        map((e) => e.body!),
        catchError((err: unknown) => {
          const msg = err instanceof ApiError ? err.message : 'Image upload failed.';
          this.snackBar.open(msg, 'Dismiss', { duration: 8000 });
          return EMPTY;
        }),
        finalize(() => {
          this.isUploadingOgImage.set(false);
          this.ogUploadProgress.set(null);
        })
      )
      .subscribe((res) => {
        this.pageForm.patchValue({ ogImage: res.url });
        this.snackBar.open('OG image URL set from upload.', 'Dismiss', { duration: 4000 });
      });
  }

  protected discardChanges(): void {
    if (this.isCreateMode()) {
      if (!this.pageForm.dirty) {
        return;
      }
      const data: ConfirmDialogData = {
        title: 'Reset new page?',
        message: 'Clear the form and start over.',
        confirmLabel: 'Reset',
        cancelLabel: 'Keep editing',
        confirmColor: 'warn'
      };
      this.dialog
        .open(ConfirmDialogComponent, { data, width: 'min(440px, 92vw)' })
        .afterClosed()
        .subscribe((confirmed) => {
          if (confirmed === true) {
            this.pageForm.reset({
              title: '',
              slug: '',
              content: '<p></p>',
              metaTitle: '',
              metaDescription: '',
              ogImage: '',
              isPublished: false
            });
            this.pageForm.markAsPristine();
          }
        });
      return;
    }

    if (!this.lookupSlug) {
      return;
    }

    if (!this.pageForm.dirty) {
      this.reloadPageFromServer();
      return;
    }

    const data: ConfirmDialogData = {
      title: 'Discard unsaved changes?',
      message: 'Your edits will be replaced with the last saved version from the server.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      confirmColor: 'warn'
    };

    this.dialog
      .open(ConfirmDialogComponent, { data, width: 'min(440px, 92vw)' })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed === true) {
          this.reloadPageFromServer();
        }
      });
  }

  private reloadPageFromServer(): void {
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

    if (this.pageForm.invalid || this.isSubmitting()) {
      this.pageForm.markAllAsTouched();
      return;
    }

    const raw = this.pageForm.getRawValue();
    const metadata = {
      metaTitle: raw.metaTitle.trim() ? raw.metaTitle.trim() : null,
      metaDescription: raw.metaDescription.trim() ? raw.metaDescription.trim() : null,
      ogImage: raw.ogImage.trim() ? raw.ogImage.trim() : null
    };

    if (this.isCreateMode()) {
      const createBody = {
        slug: raw.slug.trim(),
        title: raw.title.trim(),
        content: raw.content,
        metadata,
        publish: raw.isPublished
      };
      this.isSubmitting.set(true);
      this.adminApi
        .createPageContent(createBody)
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
              this.pageError.set('Could not create the page. Please try again.');
              this.snackBar.open('Could not create the page.', 'Dismiss', { duration: 8000 });
            }
            return EMPTY;
          }),
          finalize(() => this.isSubmitting.set(false))
        )
        .subscribe((created) => {
          this.snackBar.open('Page created.', 'Dismiss', { duration: 4000 });
          void this.router.navigate(['/content', created.slug, 'edit']);
        });
      return;
    }

    if (!this.lookupSlug) {
      this.pageForm.markAllAsTouched();
      return;
    }

    const body = {
      slug: raw.slug.trim(),
      title: raw.title.trim(),
      content: raw.content,
      metadata,
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
    this.syncHomeFeaturedProductsFromContent();
    this.pageForm.markAsPristine();
  }
}
