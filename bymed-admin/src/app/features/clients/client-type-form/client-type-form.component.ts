import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-client-type-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule],
  templateUrl: './client-type-form.component.html',
  styleUrl: './client-type-form.component.scss'
})
export class ClientTypeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminApi = inject(AdminApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly id = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = this.id !== null;
  protected readonly isInitializing = signal(this.isEditMode);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    slug: ['', [Validators.required, Validators.maxLength(120)]]
  });

  public ngOnInit(): void {
    if (!this.id) {
      this.isInitializing.set(false);
      return;
    }

    this.adminApi
      .getClientTypeById(this.id)
      .pipe(
        catchError(() => {
          this.errorMessage.set('Could not load client type.');
          return EMPTY;
        }),
        finalize(() => this.isInitializing.set(false))
      )
      .subscribe((row) => this.form.patchValue({ name: row.name, slug: row.slug }));
  }

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    const payload = {
      name: this.form.controls.name.value.trim(),
      slug: this.form.controls.slug.value.trim()
    };

    const request$ = this.id
      ? this.adminApi.updateClientType(this.id, payload)
      : this.adminApi.createClientType(payload);

    request$
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/client-types']),
        error: (err: unknown) => {
          this.errorMessage.set(err instanceof ApiError ? err.message : 'Save failed.');
        }
      });
  }
}
