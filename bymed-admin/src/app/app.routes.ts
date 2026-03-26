import { Routes } from '@angular/router';
import { AdminShellComponent } from './layout/components/admin-shell/admin-shell.component';
import { NotFoundPageComponent } from './features/system/pages/not-found-page.component';
import { authChildGuard, authGuard, loginRouteGuard } from '@core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginRouteGuard],
    loadComponent: () =>
      import('@features/auth/pages/login-page.component').then(
        (m) => m.LoginPageComponent
      )
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    component: AdminShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('@features/dashboard/pages/dashboard-page.component').then(
            (m) => m.DashboardPageComponent
          )
      }
    ]
  },
  {
    path: 'not-found',
    component: NotFoundPageComponent
  },
  {
    path: '**',
    redirectTo: 'not-found'
  }
];
