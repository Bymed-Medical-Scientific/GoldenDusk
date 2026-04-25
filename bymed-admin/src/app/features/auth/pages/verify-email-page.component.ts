import { DOCUMENT } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-verify-email-page',
  imports: [RouterLink, ButtonModule, ProgressSpinnerModule],
  templateUrl: './verify-email-page.component.html',
  styleUrls: ['./login-page.component.scss', './forgot-password-page-extra.scss']
})
export class VerifyEmailPageComponent implements OnInit {
  private readonly document = inject(DOCUMENT);

  protected readonly isSubmitting = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly isDarkMode = signal(false);

  public constructor(
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.syncThemeState();
  }

  public ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email')?.trim() ?? '';
    const token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';

    if (!email || !token) {
      this.isSubmitting.set(false);
      this.errorMessage.set('This verification link is invalid or incomplete.');
      return;
    }

    this.authService
      .confirmEmail(email, token)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Email verified successfully. You can now sign in to the admin panel.');
        },
        error: (error: { message?: string }) => {
          this.errorMessage.set(error.message ?? 'Verification failed. The link may be invalid or expired.');
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
