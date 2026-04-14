import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { AuthTokenStorageService } from '@core/auth/auth-token-storage.service';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

/** Matches backend PasswordPolicy.MinimumLength and complexity checks (server is authoritative). */
const PASSWORD_HINT =
  'At least 12 characters with uppercase, lowercase, digit, and special character.';

@Component({
  selector: 'app-register-page',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ProgressSpinnerModule
  ],
  templateUrl: './register-page.component.html',
  styleUrls: ['./login-page.component.scss', './register-page-extra.scss']
})
export class RegisterPageComponent {
  private readonly document = inject(DOCUMENT);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isDarkMode = signal(false);
  protected readonly passwordHint = PASSWORD_HINT;

  protected readonly registerForm = this.formBuilder.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.maxLength(200)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(12)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: registerPasswordsMatchValidator }
  );

  public constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly tokenStorage: AuthTokenStorageService,
    private readonly router: Router
  ) {
    this.syncThemeState();
  }

  protected submit(): void {
    if (this.registerForm.invalid || this.isSubmitting()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { name, email, password } = this.registerForm.getRawValue();

    this.authService
      .registerAdmin({ name, email, password })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (outcome) => {
          if (outcome.kind === 'pendingApproval') {
            void this.router.navigate(['/login'], { queryParams: { registered: 'pending' } });
            return;
          }

          this.authService.setSession(outcome.login);

          if (!this.authService.isAdmin()) {
            this.tokenStorage.clearSession();
            this.errorMessage.set('Registration did not create an admin account. Contact support.');
            return;
          }

          void this.router.navigateByUrl('/dashboard');
        },
        error: (error: { message?: string }) => {
          this.errorMessage.set(error.message ?? 'Registration failed. Please try again.');
        }
      });
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

const registerPasswordsMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (password === undefined || confirm === undefined) {
    return null;
  }
  if (password !== confirm) {
    return { passwordMismatch: true };
  }
  return null;
};
