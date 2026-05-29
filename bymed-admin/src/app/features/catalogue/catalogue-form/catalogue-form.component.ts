import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuillEditorComponent } from 'ngx-quill';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { catchError, EMPTY, filter, finalize, mergeMap, of, tap } from 'rxjs';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError, ApiValidationErrorItem } from '@core/api/api-error';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { PageLoadingComponent } from '@shared/components/page-loading/page-loading.component';
import {
  CatalogueItemImageDto,
  CategoryDto,
  CreateCatalogueItemRequestDto,
  UpdateCatalogueItemRequestDto
} from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
  selector: 'app-catalogue-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    GlobalErrorComponent,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    ProgressBarModule,
    SelectModule,
    PageLoadingComponent,
    QuillEditorComponent
  ],
  templateUrl: './catalogue-form.component.html',
  styleUrl: './catalogue-form.component.scss'
})
export class CatalogueFormComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminApi = inject(AdminApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly itemId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = this.itemId !== null;

  protected readonly isInitializing = signal(this.isEditMode);
  protected readonly initError = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly generalError = signal<string | null>(null);
  protected readonly categoryOptions = signal<Array<{ label: string; value: string }>>([]);
  protected readonly imagePreviewUrl = signal<string | null>(null);
  protected readonly uploadProgress = signal<number | null>(null);

  private pendingImageFile: File | null = null;
  private previewObjectUrl: string | null = null;
  private loadedPrimaryUrl: string | null = null;

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(500)]],
    slug: ['', [Validators.required, Validators.maxLength(200), Validators.pattern(SLUG_PATTERN)]],
    description: ['', [nonEmptyHtmlValidator]],
    categoryId: ['', Validators.required],
    sku: ['', [Validators.maxLength(100)]],
    brand: ['', [Validators.maxLength(120)]],
    isPublished: [true]
  });

  public ngOnInit(): void {
    this.adminApi.getCategories().subscribe({
      next: (list: CategoryDto[]) =>
        this.categoryOptions.set(list.map((c) => ({ label: c.name, value: c.id }))),
      error: () => this.categoryOptions.set([])
    });

    if (!this.isEditMode || !this.itemId) {
      this.isInitializing.set(false);
      return;
    }

    this.adminApi
      .getCatalogueItemById(this.itemId)
      .pipe(
        catchError((err: unknown) => {
          if (err instanceof ApiError && err.statusCode === 404) {
            this.initError.set('Catalogue item not found.');
          } else {
            this.initError.set('Failed to load catalogue item.');
          }
          return EMPTY;
        }),
        finalize(() => this.isInitializing.set(false))
      )
      .subscribe((item) => {
        this.form.patchValue({
          name: item.name,
          slug: item.slug,
          description: item.description ?? '',
          categoryId: item.categoryId,
          sku: item.sku ?? '',
          brand: item.brand ?? '',
          isPublished: item.isPublished
        });
        this.loadedPrimaryUrl = this.resolveMediaUrl(item.primaryImageUrl);
        this.imagePreviewUrl.set(this.loadedPrimaryUrl);
      });
  }

  public ngOnDestroy(): void {
    if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
  }

  protected submit(): void {
    this.generalError.set(null);
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();
    const sku = raw.sku.trim();
    const brand = raw.brand.trim();

    if (this.isEditMode && this.itemId) {
      const body: UpdateCatalogueItemRequestDto = {
        name: raw.name.trim(),
        slug: raw.slug.trim(),
        description: raw.description,
        categoryId: raw.categoryId,
        sku: sku || null,
        brand: brand || null,
        isPublished: raw.isPublished
      };
      this.adminApi
        .updateCatalogueItem(this.itemId, body)
        .pipe(
          mergeMap(() => this.uploadPendingImage(this.itemId!)),
          catchError((err) => {
            this.handleError(err);
            return EMPTY;
          }),
          finalize(() => this.isSubmitting.set(false))
        )
        .subscribe(() => void this.router.navigate(['/catalogue']));
      return;
    }

    const body: CreateCatalogueItemRequestDto = {
      name: raw.name.trim(),
      slug: raw.slug.trim(),
      description: raw.description,
      categoryId: raw.categoryId,
      sku: sku || null,
      brand: brand || null,
      isPublished: raw.isPublished
    };

    this.adminApi
      .createCatalogueItem(body)
      .pipe(
        mergeMap((item) => this.uploadPendingImage(item.id)),
        catchError((err) => {
          this.handleError(err);
          return EMPTY;
        }),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe(() => void this.router.navigate(['/catalogue']));
  }

  protected onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
    this.pendingImageFile = file;
    this.previewObjectUrl = URL.createObjectURL(file);
    this.imagePreviewUrl.set(this.previewObjectUrl);
  }

  private uploadPendingImage(id: string) {
    if (!this.pendingImageFile) return of(null);
    this.uploadProgress.set(0);
    return this.adminApi.uploadCatalogueItemImageWithProgress(id, this.pendingImageFile).pipe(
      tap((event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round((100 * event.loaded) / event.total));
        }
      }),
      filter((e): e is HttpResponse<CatalogueItemImageDto> => e.type === HttpEventType.Response),
      finalize(() => this.uploadProgress.set(null))
    );
  }

  private resolveMediaUrl(url?: string | null): string | null {
    if (!url?.trim()) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = this.apiBaseUrl.replace(/\/$/, '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  private handleError(err: unknown): void {
    if (err instanceof ApiError && err.validationErrors?.length) {
      const first = err.validationErrors[0] as ApiValidationErrorItem;
      this.generalError.set(first.errorMessage ?? 'Validation failed.');
      return;
    }
    this.generalError.set(err instanceof ApiError ? err.message : 'Save failed.');
  }
}
