import { BreakpointObserver } from '@angular/cdk/layout';
import { DOCUMENT } from '@angular/common';
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
import { AuthService } from '@core/auth/auth.service';
import { LowStockAlertsService } from '@core/inventory/low-stock-alerts.service';

interface NavItem {
  readonly label: string;
  readonly icon: string;
  readonly route: string;
  readonly exact?: boolean;
}

@Component({
  selector: 'app-admin-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss'
})
export class AdminShellComponent {
  private readonly document = inject(DOCUMENT);
  private readonly lowStockAlerts = inject(LowStockAlertsService);

  protected readonly isNavigating = signal(false);
  protected readonly isHandset = signal(false);
  protected readonly sidebarOpen = signal(false);
  protected readonly userMenuOpen = signal(false);
  protected readonly isDarkMode = signal(false);
  protected readonly currentUrl = signal('');
  protected readonly lowStockCount = computed(() => this.lowStockAlerts.items().length);
  protected readonly showLowStockBanner = computed(
    () => this.lowStockCount() > 0 && this.currentUrl().startsWith('/inventory')
  );
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
  protected readonly navItems: readonly NavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard', exact: true },
    { label: 'Content', icon: 'pi pi-file-edit', route: '/content' },
    { label: 'Categories', icon: 'pi pi-th-large', route: '/categories' },
    { label: 'Products', icon: 'pi pi-box', route: '/products' },
    { label: 'Client Types', icon: 'pi pi-tags', route: '/client-types' },
    { label: 'Clients', icon: 'pi pi-building', route: '/clients' },
    { label: 'Inventory', icon: 'pi pi-warehouse', route: '/inventory' },
    { label: 'Orders', icon: 'pi pi-shopping-cart', route: '/orders', exact: true },
    { label: 'Sales Analytics', icon: 'pi pi-chart-bar', route: '/orders/analytics' },
    { label: 'Contact Messages', icon: 'pi pi-envelope', route: '/contact-messages' },
    { label: 'Contact Recipients', icon: 'pi pi-users', route: '/contact-recipients' },
    { label: 'Admin Approvals', icon: 'pi pi-user-plus', route: '/admin-approvals' }
  ];

  constructor(
    private readonly router: Router,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly authService: AuthService
  ) {
    this.lowStockAlerts.refresh();
    this.currentUrl.set(this.router.url);
    this.syncThemeState();
    this.breakpointObserver
      .observe('(max-width: 960px)')
      .pipe(takeUntilDestroyed())
      .subscribe((state) => {
        this.isHandset.set(state.matches);
        if (!state.matches) {
          this.sidebarOpen.set(false);
        }
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

        if (event instanceof NavigationEnd) {
          this.currentUrl.set(event.urlAfterRedirects);
        }

        this.isNavigating.set(false);
      });
  }

  protected logout(): void {
    this.userMenuOpen.set(false);
    this.authService.logout().subscribe();
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update((value) => !value);
  }

  protected closeSidebarForHandset(): void {
    if (this.isHandset()) {
      this.sidebarOpen.set(false);
    }
  }

  protected toggleUserMenu(): void {
    this.userMenuOpen.update((value) => !value);
  }

  protected toggleTheme(): void {
    const next = !this.isDarkMode();
    this.isDarkMode.set(next);
    this.document.body.classList.toggle('app-dark', next);
    this.document.body.classList.toggle('app-light', !next);
    localStorage.setItem('bymed-admin-theme', next ? 'dark' : 'light');
  }

  private isNavigationEvent(event: Event): boolean {
    return (
      event instanceof NavigationStart ||
      event instanceof NavigationEnd ||
      event instanceof NavigationCancel ||
      event instanceof NavigationError
    );
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
