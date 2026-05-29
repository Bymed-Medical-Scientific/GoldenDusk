import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { catchError, EMPTY, filter, finalize, map, mergeMap, of, tap } from 'rxjs';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError, ApiValidationErrorItem } from '@core/api/api-error';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { PageLoadingComponent } from '@shared/components/page-loading/page-loading.component';
import { BrandDto, CreateBrandRequestDto, UpdateBrandRequestDto } from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

const NAME_MAX_LENGTH = 120;
const WEBSITE_MAX_LENGTH = 500;

@Component({
  selector: 'app-brand-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    GlobalErrorComponent,
    ButtonModule,
    InputTextModule,
    ProgressBarModule,
    ProgressSpinnerModule,
    PageLoadingComponent
  ],
  templateUrl: './brand-form.component.html',
  styleUrl: './brand-form.component.scss'
})
export class BrandFormComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminApi = inject(AdminApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly brandId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = this.brandId !== null;

  protected readonly isInitializing = signal(this.isEditMode);
  protected readonly initError = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly generalError = signal<string | null>(null);
  protected readonly pageMessage = signal<string | null>(null);
  protected readonly serverFieldErrors = signal<Record<string, string>>({});
  protected readonly logoPreviewUrl = signal<string | null>(null);
  protected readonly uploadProgress = signal<number | null>(null);

  private pendingLogoFile: File | null = null;
  private previewObjectUrl: string | null = null;
  private loadedLogoUrl: string | null = null;

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
    websiteUrl: ['', [Validators.maxLength(WEBSITE_MAX_LENGTH)]]
  });

  public ngOnInit(): void {
    if (!this.isEditMode || !this.brandId) {
      this.isInitializing.set(false);
      return;
    }

    this.adminApi
      .getBrandById(this.brandId)
      .pipe(
        catchError((err: unknown) => {
          if (err instanceof ApiError && err.statusCode === 404) {
            this.initError.set('This brand was not found.');
          } else {
            this.initError.set('The brand could not be loaded. Please try again.');
          }
          return EMPTY;
        }),
        finalize(() => this.isInitializing.set(false))
      )
      .subscribe((brand) => {
        this.form.patchValue({
          name: brand.name,
          websiteUrl: brand.websiteUrl ?? ''
        });
        this.loadedLogoUrl = this.resolveMediaUrl(brand.logoUrl);
        this.logoPreviewUrl.set(this.loadedLogoUrl);
      });
  }

  public ngOnDestroy(): void {
    if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
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
    const payload = this.buildPayload();

    if (this.isEditMode && this.brandId) {
      const brandId = this.brandId;
      this.adminApi
        .updateBrand(brandId, payload)
        .pipe(
          mergeMap(() => this.uploadPendingLogoIfAny(brandId)),
          catchError((err) => {
            this.handleSaveError(err);
            return EMPTY;
          }),
          finalize(() => this.isSubmitting.set(false))
        )
        .subscribe(() => void this.router.navigate(['/brands']));
      return;
    }

    this.adminApi
      .createBrand(payload)
      .pipe(
        mergeMap((brand) => this.uploadPendingLogoIfAny(brand.id)),
        catchError((err) => {
          this.handleSaveError(err);
          return EMPTY;
        }),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe(() => void this.router.navigate(['/brands']));
  }

  protected fieldError(controlName: string): string | null {
    const server = this.serverFieldErrors()[controlName];
    if (server) return server;

    const control = this.form.get(controlName);
    if (!control || (!control.touched && !control.dirty)) return null;

    if (controlName === 'name' && control.hasError('required')) return 'Name is required.';
    if (controlName === 'name' && control.hasError('maxlength')) {
      return `Name must not exceed ${NAME_MAX_LENGTH} characters.`;
    }
    if (controlName === 'websiteUrl' && control.hasError('maxlength')) {
      return `Website URL must not exceed ${WEBSITE_MAX_LENGTH} characters.`;
    }

    return null;
  }

  protected onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
    this.pendingLogoFile = file;
    this.previewObjectUrl = URL.createObjectURL(file);
    this.logoPreviewUrl.set(this.previewObjectUrl);
  }

  protected clearLogoSelection(): void {
    this.pendingLogoFile = null;
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
    this.logoPreviewUrl.set(this.isEditMode ? this.loadedLogoUrl : null);
  }

  private buildPayload(): CreateBrandRequestDto {
    const raw = this.form.getRawValue();
    const website = raw.websiteUrl.trim();
    return {
      name: raw.name.trim(),
      websiteUrl: website.length > 0 ? website : null
    };
  }

  private uploadPendingLogoIfAny(brandId: string) {
    if (!this.pendingLogoFile) return of(undefined);
    const file = this.pendingLogoFile;
    this.pendingLogoFile = null;
    this.uploadProgress.set(0);
    return this.adminApi.uploadBrandLogoWithProgress(brandId, file).pipe(
      tap((event) => {
        if (event.type === HttpEventType.UploadProgress && event.total && event.total > 0) {
          this.uploadProgress.set(Math.round((100 * event.loaded) / event.total));
        }
      }),
      filter((e): e is HttpResponse<BrandDto> => e.type === HttpEventType.Response),
      map(() => undefined),
      catchError(() => {
        this.pageMessage.set('Brand saved but logo upload failed.');
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
      const map: Record<string, string> = {};
      for (const item of err.validationErrors as ApiValidationErrorItem[]) {
        const key = item.propertyName.charAt(0).toLowerCase() + item.propertyName.slice(1);
        map[key] = item.errorMessage;
      }
      this.serverFieldErrors.set(map);
      return;
    }
    this.generalError.set(err.message);
  }

  private resolveMediaUrl(url?: string | null): string | null {
    if (!url?.trim()) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    try {
      const origin = new URL(this.apiBaseUrl).origin;
      return url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`;
    } catch {
      return url;
    }
  }
}
