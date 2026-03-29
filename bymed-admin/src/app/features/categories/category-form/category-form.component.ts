import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError, ApiValidationErrorItem } from '@core/api/api-error';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { PageLoadingComponent } from '@shared/components/page-loading/page-loading.component';
import { CreateCategoryRequestDto, UpdateCategoryRequestDto } from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TextareaModule } from 'primeng/textarea';

const NAME_MAX_LENGTH = 200;
const SLUG_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 4000;
/** Matches server FluentValidation: lowercase letters, digits, hyphens; segments separated by single hyphen. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function mapServerPropertyToFormKey(propertyName: string): string {
  const map: Record<string, string> = {
    Name: 'name',
    Slug: 'slug',
    Description: 'description',
    DisplayOrder: 'displayOrder'
  };
  return map[propertyName] ?? propertyName.charAt(0).toLowerCase() + propertyName.slice(1);
}

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    GlobalErrorComponent,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    TextareaModule,
    ProgressSpinnerModule,
    PageLoadingComponent
  ],
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.scss'
})
export class CategoryFormComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminApi = inject(AdminApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly categoryId = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = this.categoryId !== null;

  protected readonly isInitializing = signal(this.isEditMode);
  protected readonly initError = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly generalError = signal<string | null>(null);
  protected readonly serverFieldErrors = signal<Record<string, string>>({});

  protected readonly categoryForm = this.formBuilder.nonNullable.group({
    name: [
      '',
      [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]
    ],
    slug: [
      '',
      [
        Validators.required,
        Validators.maxLength(SLUG_MAX_LENGTH),
        Validators.pattern(SLUG_PATTERN)
      ]
    ],
    description: ['', [Validators.maxLength(DESCRIPTION_MAX_LENGTH)]],
    displayOrder: this.formBuilder.nonNullable.control<number>(0, {
      validators: [Validators.required, Validators.min(0)]
    })
  });

  public ngOnInit(): void {
    if (!this.isEditMode || !this.categoryId) {
      this.isInitializing.set(false);
      return;
    }

    this.adminApi
      .getCategoryById(this.categoryId)
      .pipe(
        catchError((err: unknown) => {
          if (err instanceof ApiError && err.statusCode === 404) {
            this.initError.set('This category was not found.');
          } else {
            this.initError.set('The category could not be loaded. Please try again.');
          }
          return EMPTY;
        }),
        finalize(() => this.isInitializing.set(false))
      )
      .subscribe((category) => {
        this.categoryForm.patchValue({
          name: category.name,
          slug: category.slug,
          description: category.description ?? '',
          displayOrder: category.displayOrder
        });
      });
  }

  protected submit(): void {
    this.generalError.set(null);
    this.serverFieldErrors.set({});

    if (this.categoryForm.invalid || this.isSubmitting()) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const raw = this.categoryForm.getRawValue();
    const displayOrder = Number(raw.displayOrder);
    if (!Number.isFinite(displayOrder) || displayOrder < 0) {
      this.categoryForm.controls.displayOrder.setErrors({ min: true });
      this.categoryForm.controls.displayOrder.markAsTouched();
      return;
    }

    const descriptionTrimmed = raw.description.trim();
    const payloadBase = {
      name: raw.name.trim(),
      slug: raw.slug.trim(),
      description: descriptionTrimmed.length > 0 ? descriptionTrimmed : undefined,
      displayOrder
    };

    this.isSubmitting.set(true);

    const save$ =
      this.isEditMode && this.categoryId
        ? this.adminApi.updateCategory(this.categoryId, payloadBase as UpdateCategoryRequestDto)
        : this.adminApi.createCategory(payloadBase as CreateCategoryRequestDto);

    save$
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/categories']),
        error: (err: unknown) => this.handleSaveError(err)
      });
  }

  protected fieldError(controlName: string): string | null {
    const server = this.serverFieldErrors()[controlName];
    if (server) {
      return server;
    }

    const control = this.categoryForm.get(controlName);
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
      return 'Use a URL-safe slug: lowercase letters, digits, and hyphens only (e.g. medical-equipment).';
    }
    if (controlName === 'description' && control.hasError('maxlength')) {
      return `Description must not exceed ${DESCRIPTION_MAX_LENGTH} characters.`;
    }
    if (controlName === 'displayOrder') {
      if (control.hasError('required')) {
        return 'Display order is required.';
      }
      if (control.hasError('min')) {
        return 'Display order must be zero or greater.';
      }
    }

    return null;
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
      const control = this.categoryForm.get(key);
      control?.updateValueAndValidity({ emitEvent: false });
      control?.markAsTouched();
    }
    this.serverFieldErrors.set(map);
  }
}
