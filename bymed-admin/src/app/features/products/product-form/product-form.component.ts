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
import { LowStockAlertsService } from '@core/inventory/low-stock-alerts.service';
import { ApiError, ApiValidationErrorItem } from '@core/api/api-error';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { PageLoadingComponent } from '@shared/components/page-loading/page-loading.component';
import {
  CategoryDto,
  CreateProductRequestDto,
  ProductDto,
  ProductImageDto,
  UpdateProductRequestDto
} from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';

const NAME_MAX_LENGTH = 500;
const SLUG_MAX_LENGTH = 200;
const SKU_MAX_LENGTH = 100;
const DESCRIPTION_MAX_HTML_LENGTH = 200000;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

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
    Price: 'price',
    InventoryCount: 'inventoryCount',
    LowStockThreshold: 'lowStockThreshold',
    Sku: 'sku',
    Currency: 'currency'
  };
  return map[propertyName] ?? propertyName.charAt(0).toLowerCase() + propertyName.slice(1);
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    GlobalErrorComponent,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    ProgressBarModule,
    ProgressSpinnerModule,
    SelectModule,
    PageLoadingComponent,
    QuillEditorComponent
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminApi = inject(AdminApiService);
  private readonly lowStockAlerts = inject(LowStockAlertsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly productId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = this.productId !== null;

  protected readonly isInitializing = signal(this.isEditMode);
  protected readonly initError = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly generalError = signal<string | null>(null);
  protected readonly pageMessage = signal<string | null>(null);
  protected readonly serverFieldErrors = signal<Record<string, string>>({});
  protected readonly categories = signal<CategoryDto[]>([]);
  protected readonly categoryOptions = signal<Array<{ label: string; value: string }>>([]);
  protected readonly imagePreviewUrl = signal<string | null>(null);
  /** 0–100 while primary image is uploading after save; null when idle. */
  protected readonly primaryImageUploadProgress = signal<number | null>(null);
  /** Set in edit mode after load — used for read-only availability. */
  protected readonly loadedProduct = signal<ProductDto | null>(null);

  private pendingImageFile: File | null = null;
  private previewObjectUrl: string | null = null;
  private loadedPrimaryUrl: string | null = null;

  protected readonly productForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
    slug: ['', [Validators.required, Validators.maxLength(SLUG_MAX_LENGTH), Validators.pattern(SLUG_PATTERN)]],
    description: ['', [nonEmptyHtmlValidator, Validators.maxLength(DESCRIPTION_MAX_HTML_LENGTH)]],
    categoryId: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    currency: ['USD', [Validators.required, Validators.pattern(CURRENCY_PATTERN)]],
    inventoryCount: [0, [Validators.required, Validators.min(0)]],
    lowStockThreshold: [0, [Validators.required, Validators.min(0)]],
    sku: ['', [Validators.maxLength(SKU_MAX_LENGTH)]]
  });

  public ngOnInit(): void {
    this.adminApi.getCategories().subscribe({
      next: (list) => {
        this.categories.set(list);
        this.categoryOptions.set(list.map((c) => ({ label: c.name, value: c.id })));
      },
      error: () => this.categories.set([])
    });

    if (!this.isEditMode || !this.productId) {
      this.isInitializing.set(false);
      return;
    }

    this.adminApi
      .getProductById(this.productId)
      .pipe(
        catchError((err: unknown) => {
          if (err instanceof ApiError && err.statusCode === 404) {
            this.initError.set('This product was not found.');
          } else {
            this.initError.set('The product could not be loaded. Please try again.');
          }
          return EMPTY;
        }),
        finalize(() => this.isInitializing.set(false))
      )
      .subscribe((product) => {
        this.loadedProduct.set(product);
        this.patchFormFromProduct(product);
        this.loadedPrimaryUrl = this.resolveMediaUrl(product.primaryImageUrl);
        this.imagePreviewUrl.set(this.loadedPrimaryUrl);
        this.productForm.controls.inventoryCount.disable();
        this.productForm.controls.currency.disable();
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

    if (this.productForm.invalid || this.isSubmitting()) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    if (this.isEditMode && this.productId) {
      const body = this.buildUpdatePayload();
      this.adminApi
        .updateProduct(this.productId, body)
        .pipe(
          mergeMap(() => this.uploadPendingImageIfAny(this.productId)),
          catchError((err: unknown) => {
            this.handleSaveError(err);
            return EMPTY;
          }),
          finalize(() => this.isSubmitting.set(false))
        )
        .subscribe(() => {
          this.lowStockAlerts.refresh();
          void this.router.navigate(['/products']);
        });
      return;
    }

    const body = this.buildCreatePayload();
    this.adminApi
      .createProduct(body)
      .pipe(
        mergeMap((product) => this.uploadPendingImageAfterCreate(product)),
        catchError((err: unknown) => {
          this.handleSaveError(err);
          return EMPTY;
        }),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe(() => {
        this.lowStockAlerts.refresh();
        void this.router.navigate(['/products']);
      });
  }

  protected fieldError(controlName: string): string | null {
    const server = this.serverFieldErrors()[controlName];
    if (server) {
      return server;
    }

    const control = this.productForm.get(controlName);
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
    if (controlName === 'price' && control.hasError('required')) {
      return 'Price is required.';
    }
    if (controlName === 'price' && control.hasError('min')) {
      return 'Price cannot be negative.';
    }
    if (controlName === 'currency' && control.hasError('pattern')) {
      return 'Use a 3-letter currency code (e.g. USD).';
    }
    if (controlName === 'inventoryCount' && control.hasError('min')) {
      return 'Inventory cannot be negative.';
    }
    if (controlName === 'lowStockThreshold' && control.hasError('min')) {
      return 'Low stock threshold cannot be negative.';
    }
    if (controlName === 'sku' && control.hasError('maxlength')) {
      return `SKU must not exceed ${SKU_MAX_LENGTH} characters.`;
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

  protected onCurrencyBlur(): void {
    const c = this.productForm.controls.currency;
    if (c.disabled) {
      return;
    }
    const v = c.value?.trim().toUpperCase();
    if (v) {
      c.setValue(v);
    }
  }

  private patchFormFromProduct(product: ProductDto): void {
    this.productForm.patchValue({
      name: product.name,
      slug: product.slug ?? '',
      description: product.description ?? '',
      categoryId: product.categoryId,
      price: product.price,
      currency: product.currency,
      inventoryCount: product.inventoryCount,
      lowStockThreshold: product.lowStockThreshold,
      sku: product.sku ?? ''
    });
  }

  private buildCreatePayload(): CreateProductRequestDto {
    const raw = this.productForm.getRawValue();
    const sku = raw.sku.trim();
    return {
      name: raw.name.trim(),
      slug: raw.slug.trim(),
      description: raw.description,
      categoryId: raw.categoryId,
      price: Number(raw.price),
      inventoryCount: Math.floor(Number(raw.inventoryCount)),
      lowStockThreshold: Math.floor(Number(raw.lowStockThreshold)),
      sku: sku.length > 0 ? sku : undefined,
      currency: raw.currency.trim() || 'USD',
      specifications: undefined
    };
  }

  private buildUpdatePayload(): UpdateProductRequestDto {
    const raw = this.productForm.getRawValue();
    const sku = raw.sku.trim();
    return {
      name: raw.name.trim(),
      slug: raw.slug.trim(),
      description: raw.description,
      categoryId: raw.categoryId,
      price: Number(raw.price),
      lowStockThreshold: Math.floor(Number(raw.lowStockThreshold)),
      sku: sku.length > 0 ? sku : undefined,
      specifications: undefined
    };
  }

  private uploadPendingImageIfAny(productId: string | null) {
    if (!productId || !this.pendingImageFile) {
      return of(undefined);
    }

    const file = this.pendingImageFile;
    const alt = this.productForm.get('name')?.value?.trim() ?? '';
    this.pendingImageFile = null;
    this.primaryImageUploadProgress.set(0);
    return this.adminApi.uploadProductImageWithProgress(productId, file, alt).pipe(
      tap((event) => {
        if (event.type === HttpEventType.UploadProgress && event.total && event.total > 0) {
          this.primaryImageUploadProgress.set(Math.round((100 * event.loaded) / event.total));
        }
      }),
      filter((e): e is HttpResponse<ProductImageDto> => e.type === HttpEventType.Response),
      map(() => undefined),
      catchError(() => {
        this.pageMessage.set('Product saved but image upload failed.');
        return of(undefined);
      }),
      finalize(() => this.primaryImageUploadProgress.set(null))
    );
  }

  private uploadPendingImageAfterCreate(product: ProductDto) {
    if (!this.pendingImageFile) {
      return of(undefined);
    }

    const file = this.pendingImageFile;
    this.pendingImageFile = null;
    this.primaryImageUploadProgress.set(0);
    return this.adminApi.uploadProductImageWithProgress(product.id, file, product.name).pipe(
      tap((event) => {
        if (event.type === HttpEventType.UploadProgress && event.total && event.total > 0) {
          this.primaryImageUploadProgress.set(Math.round((100 * event.loaded) / event.total));
        }
      }),
      filter((e): e is HttpResponse<ProductImageDto> => e.type === HttpEventType.Response),
      map(() => undefined),
      catchError(() => {
        this.pageMessage.set('Product saved but image upload failed.');
        return of(undefined);
      }),
      finalize(() => this.primaryImageUploadProgress.set(null))
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
      const control = this.productForm.get(key);
      control?.updateValueAndValidity({ emitEvent: false });
      control?.markAsTouched();
    }
    this.serverFieldErrors.set(map);
  }

  private resolveMediaUrl(url: string | undefined): string | null {
    if (!url) {
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
