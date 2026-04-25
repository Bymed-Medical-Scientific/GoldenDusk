import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-reset-password-page',
  imports: [ReactiveFormsModule, PasswordModule, ButtonModule, ProgressSpinnerModule],
  templateUrl: './reset-password-page.component.html',
  styleUrls: ['./login-page.component.scss', './forgot-password-page-extra.scss']
})
export class ResetPasswordPageComponent {
  private readonly document = inject(DOCUMENT);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly isDarkMode = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  });

  public constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.syncThemeState();
  }

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.route.snapshot.queryParamMap.get('email')?.trim() ?? '';
    const token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';
    if (!email || !token) {
      this.errorMessage.set('Reset link is invalid or incomplete.');
      return;
    }

    const { newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService
      .confirmPasswordReset({ email, token, newPassword })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Password updated successfully. You can now sign in.');
        },
        error: (error: { message?: string }) => {
          this.errorMessage.set(error.message ?? 'Failed to reset password. Link may be invalid or expired.');
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
