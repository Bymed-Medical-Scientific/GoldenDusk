import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink, InputTextModule, ButtonModule, ProgressSpinnerModule],
  templateUrl: './forgot-password-page.component.html',
  styleUrls: ['./login-page.component.scss', './forgot-password-page-extra.scss']
})
export class ForgotPasswordPageComponent {
  private readonly document = inject(DOCUMENT);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly isDarkMode = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  public constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.syncThemeState();
  }

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const email = this.form.getRawValue().email;

    this.authService
      .requestPasswordReset({ email })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set(
            'If an account exists for that email, we sent a link to reset your password. Check your inbox.'
          );
        },
        error: (error: { message?: string }) => {
          this.errorMessage.set(error.message ?? 'Request failed. Please try again.');
        }
      });
  }

  protected goToLogin(): void {
    void this.router.navigate(['/login']);
  }

  protected toggleTheme(): void {
    const next = !this.isDarkMode();
    this.isDarkMode.set(next);
    this.document.body.classList.toggle('app-dark', next);
    this.document.body.classList.toggle('app-light', !next);
    localStorage.setItem('bymed-admin-theme', next ? 'dark' : 'light');
  }

  private syncThemeState(): void {
    const storedTheme = localStorage.getItem('bymed-admin-theme');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    const initialDark = storedTheme ? storedTheme === 'dark' : prefersDark;
    this.isDarkMode.set(initialDark);
    this.document.body.classList.toggle('app-dark', initialDark);
    this.document.body.classList.toggle('app-light', !initialDark);
  }
}
