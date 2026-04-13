import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { AuthTokenStorageService } from '@core/auth/auth-token-storage.service';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CheckboxModule,
    ProgressSpinnerModule
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  private readonly document = inject(DOCUMENT);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly rememberMe = signal(false);
  protected readonly isDarkMode = signal(false);

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  public constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly tokenStorage: AuthTokenStorageService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.syncThemeState();
  }

  protected submit(): void {
    if (this.loginForm.invalid || this.isSubmitting()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          if (!this.authService.isAdmin()) {
            this.tokenStorage.clearSession();
            this.errorMessage.set('This account is not an admin account. Please use admin credentials.');
            return;
          }

          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
          void this.router.navigateByUrl(returnUrl).then((navigated) => {
            if (!navigated) {
              this.errorMessage.set(
                'Signed in but access was denied. Ensure this account has the Admin role.'
              );
            }
          });
        },
        error: (error: { message?: string }) => {
          this.errorMessage.set(error.message ?? 'Login failed. Please check your credentials.');
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
