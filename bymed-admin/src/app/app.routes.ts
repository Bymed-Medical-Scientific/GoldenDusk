import { Routes } from '@angular/router';
import { AdminShellComponent } from './layout/components/admin-shell/admin-shell.component';
import { NotFoundPageComponent } from './features/system/pages/not-found-page.component';

export const routes: Routes = [
  {
    path: '',
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
