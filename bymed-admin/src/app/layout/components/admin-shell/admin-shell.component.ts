import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Event,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '@core/auth/auth.service';
import { LowStockAlertsService } from '@core/inventory/low-stock-alerts.service';

@Component({
    selector: 'app-admin-shell',
    imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSidenavModule,
    MatToolbarModule,
    MatBadgeModule
],
    templateUrl: './admin-shell.component.html',
    styleUrl: './admin-shell.component.scss'
})
export class AdminShellComponent {
  private readonly lowStockAlerts = inject(LowStockAlertsService);

  protected readonly isNavigating = signal(false);
  protected readonly isHandset = signal(false);
  protected readonly sidenavOpened = computed(() => !this.isHandset());
  protected readonly lowStockCount = computed(() => this.lowStockAlerts.items().length);
  protected readonly lowStockBadge = computed(() => {
    const n = this.lowStockCount();
    if (n <= 0) {
      return '';
    }
    return n > 99 ? '99+' : String(n);
  });
  protected readonly lowStockPreview = computed(() => {
    const items = this.lowStockAlerts.items();
    return items.slice(0, 3);
  });
  protected readonly lowStockOverflow = computed(() => Math.max(this.lowStockCount() - 3, 0));

  constructor(
    private readonly router: Router,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly authService: AuthService
  ) {
    this.lowStockAlerts.refresh();
    this.breakpointObserver
      .observe('(max-width: 960px)')
      .pipe(takeUntilDestroyed())
      .subscribe((state) => {
        this.isHandset.set(state.matches);
      });

    this.router.events
      .pipe(
        filter((event: Event) => this.isNavigationEvent(event)),
        takeUntilDestroyed()
      )
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.isNavigating.set(true);
          return;
        }

        this.isNavigating.set(false);
      });
  }

  protected logout(): void {
    this.authService.logout().subscribe();
  }

  private isNavigationEvent(event: Event): boolean {
    return (
      event instanceof NavigationStart ||
      event instanceof NavigationEnd ||
      event instanceof NavigationCancel ||
      event instanceof NavigationError
    );
  }
}
