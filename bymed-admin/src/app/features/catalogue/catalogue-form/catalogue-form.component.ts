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
import { catchError, EMPTY, filter, finalize, map, mergeMap, of, tap } from 'rxjs';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError, ApiValidationErrorItem } from '@core/api/api-error';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { PageLoadingComponent } from '@shared/components/page-loading/page-loading.component';
import {
  CatalogueItemDto,
  CatalogueItemImageDto,
  CategoryDto,
  CreateCatalogueItemRequestDto,
  UpdateCatalogueItemRequestDto
} from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';

const NAME_MAX_LENGTH = 500;
const SLUG_MAX_LENGTH = 200;
const SKU_MAX_LENGTH = 100;
const BRAND_MAX_LENGTH = 120;
const DESCRIPTION_MAX_HTML_LENGTH = 200000;
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

function mapServerPropertyToFormKey(propertyName: string): string {
  const map: Record<string, string> = {
    Name: 'name',
    Slug: 'slug',
    Description: 'description',
    CategoryId: 'categoryId',
    Sku: 'sku',
    Brand: 'brand',
    IsPublished: 'isPublished'
  };
  return map[propertyName] ?? propertyName.charAt(0).toLowerCase() + propertyName.slice(1);
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
    ProgressSpinnerModule,
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
  protected readonly pageMessage = signal<string | null>(null);
  protected readonly serverFieldErrors = signal<Record<string, string>>({});
  protected readonly categoryOptions = signal<Array<{ label: string; value: string }>>([]);
  protected readonly imagePreviewUrl = signal<string | null>(null);
  protected readonly uploadProgress = signal<number | null>(null);

  private pendingImageFile: File | null = null;
  private previewObjectUrl: string | null = null;
  private loadedPrimaryUrl: string | null = null;

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
    slug: ['', [Validators.required, Validators.maxLength(SLUG_MAX_LENGTH), Validators.pattern(SLUG_PATTERN)]],
    description: ['', [nonEmptyHtmlValidator, Validators.maxLength(DESCRIPTION_MAX_HTML_LENGTH)]],
    categoryId: ['', Validators.required],
    sku: ['', [Validators.maxLength(SKU_MAX_LENGTH)]],
    brand: ['', [Validators.maxLength(BRAND_MAX_LENGTH)]],
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
            this.initError.set('This catalogue item was not found.');
          } else {
            this.initError.set('The catalogue item could not be loaded. Please try again.');
          }
          return EMPTY;
        }),
        finalize(() => this.isInitializing.set(false))
      )
      .subscribe((item) => {
        this.patchFormFromItem(item);
        this.loadedPrimaryUrl = this.resolveMediaUrl(item.primaryImageUrl);
        this.imagePreviewUrl.set(this.loadedPrimaryUrl);
      });
  }

  public ngOnDestroy(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
    }
  }

  protected submit(): void {
    this.generalError.set(null);
    this.pageMessage.set(null);
    this.serverFieldErrors.set({});

    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    if (this.isEditMode && this.itemId) {
      this.adminApi
        .updateCatalogueItem(this.itemId, this.buildUpdatePayload())
        .pipe(
          mergeMap(() => this.uploadPendingImageIfAny(this.itemId!)),
          catchError((err: unknown) => {
            this.handleSaveError(err);
            return EMPTY;
          }),
          finalize(() => this.isSubmitting.set(false))
        )
        .subscribe(() => void this.router.navigate(['/catalogue']));
      return;
    }

    this.adminApi
      .createCatalogueItem(this.buildCreatePayload())
      .pipe(
        mergeMap((item) => this.uploadPendingImageIfAny(item.id)),
        catchError((err: unknown) => {
          this.handleSaveError(err);
          return EMPTY;
        }),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe(() => void this.router.navigate(['/catalogue']));
  }

  protected fieldError(controlName: string): string | null {
    const server = this.serverFieldErrors()[controlName];
    if (server) {
      return server;
    }

    const control = this.form.get(controlName);
    if (!control || (!control.touched && !control.dirty)) {
      return null;
    }

    if (controlName === 'name' && control.hasError('required')) {
      return 'Name is required.';
    }
    if (controlName === 'name' && control.hasError('maxlength')) {
      return `Name must not exceed ${NAME_MAX_LENGTH} characters.`;
    }
    if (controlName === 'slug' && control.hasError('required')) {
      return 'Slug is required.';
    }
    if (controlName === 'slug' && control.hasError('maxlength')) {
      return `Slug must not exceed ${SLUG_MAX_LENGTH} characters.`;
    }
    if (controlName === 'slug' && control.hasError('pattern')) {
      return 'Use a URL-safe slug: lowercase letters, digits, and hyphens only.';
    }
    if (controlName === 'description' && (control.hasError('required') || control.errors?.['required'])) {
      return 'Description is required.';
    }
    if (controlName === 'description' && control.hasError('maxlength')) {
      return 'Description is too long.';
    }
    if (controlName === 'categoryId' && control.hasError('required')) {
      return 'Category is required.';
    }
    if (controlName === 'sku' && control.hasError('maxlength')) {
      return `SKU must not exceed ${SKU_MAX_LENGTH} characters.`;
    }
    if (controlName === 'brand' && control.hasError('maxlength')) {
      return `Brand must not exceed ${BRAND_MAX_LENGTH} characters.`;
    }

    return null;
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }

    this.pendingImageFile = file;
    this.previewObjectUrl = URL.createObjectURL(file);
    this.imagePreviewUrl.set(this.previewObjectUrl);
  }

  protected clearImageSelection(): void {
    this.pendingImageFile = null;
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
    this.imagePreviewUrl.set(this.isEditMode ? this.loadedPrimaryUrl : null);
  }

  private patchFormFromItem(item: CatalogueItemDto): void {
    this.form.patchValue({
      name: item.name,
      slug: item.slug,
      description: item.description ?? '',
      categoryId: item.categoryId,
      sku: item.sku ?? '',
      brand: item.brand ?? '',
      isPublished: item.isPublished
    });
  }

  private buildCreatePayload(): CreateCatalogueItemRequestDto {
    const raw = this.form.getRawValue();
    const sku = raw.sku.trim();
    const brand = raw.brand.trim();
    return {
      name: raw.name.trim(),
      slug: raw.slug.trim(),
      description: raw.description,
      categoryId: raw.categoryId,
      sku: sku.length > 0 ? sku : null,
      brand: brand.length > 0 ? brand : null,
      isPublished: raw.isPublished
    };
  }

  private buildUpdatePayload(): UpdateCatalogueItemRequestDto {
    return this.buildCreatePayload();
  }

  private uploadPendingImageIfAny(catalogueItemId: string) {
    if (!this.pendingImageFile) {
      return of(undefined);
    }

    const file = this.pendingImageFile;
    this.pendingImageFile = null;
    this.uploadProgress.set(0);

    return this.adminApi.uploadCatalogueItemImageWithProgress(catalogueItemId, file).pipe(
      tap((event) => {
        if (event.type === HttpEventType.UploadProgress && event.total && event.total > 0) {
          this.uploadProgress.set(Math.round((100 * event.loaded) / event.total));
        }
      }),
      filter((e): e is HttpResponse<CatalogueItemImageDto> => e.type === HttpEventType.Response),
      map(() => undefined),
      catchError(() => {
        this.pageMessage.set('Item saved but image upload failed.');
        return of(undefined);
      }),
      finalize(() => this.uploadProgress.set(null))
    );
  }

  private handleSaveError(err: unknown): void {
    if (!(err instanceof ApiError)) {
      this.generalError.set('Saving failed. Please try again.');
      return;
    }

    if (err.validationErrors?.length) {
      this.applyServerValidationErrors(err.validationErrors);
      this.generalError.set(null);
      return;
    }

    this.generalError.set(err.message);
  }

  private applyServerValidationErrors(items: readonly ApiValidationErrorItem[]): void {
    const map: Record<string, string> = {};
    for (const item of items) {
      const key = mapServerPropertyToFormKey(item.propertyName);
      map[key] = item.errorMessage;
      const control = this.form.get(key);
      control?.updateValueAndValidity({ emitEvent: false });
      control?.markAsTouched();
    }
    this.serverFieldErrors.set(map);
  }

  private resolveMediaUrl(url?: string | null): string | null {
    if (!url?.trim()) {
      return null;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    try {
      const origin = new URL(this.apiBaseUrl).origin;
      return url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`;
    } catch {
      return url;
    }
  }
}
