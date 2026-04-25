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
    path: 'register',
    canActivate: [loginRouteGuard],
    loadComponent: () =>
      import('@features/auth/pages/register-page.component').then(
        (m) => m.RegisterPageComponent
      )
  },
  {
    path: 'verify-email',
    canActivate: [loginRouteGuard],
    loadComponent: () =>
      import('@features/auth/pages/verify-email-page.component').then(
        (m) => m.VerifyEmailPageComponent
      )
  },
  {
    path: 'forgot-password',
    canActivate: [loginRouteGuard],
    loadComponent: () =>
      import('@features/auth/pages/forgot-password-page.component').then(
        (m) => m.ForgotPasswordPageComponent
      )
  },
  {
    path: 'reset-password',
    canActivate: [loginRouteGuard],
    loadComponent: () =>
      import('@features/auth/pages/reset-password-page.component').then(
        (m) => m.ResetPasswordPageComponent
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
      },
      {
        path: 'content/new',
        loadComponent: () =>
          import('@features/content/content-editor-page/content-editor-page.component').then(
            (m) => m.ContentEditorPageComponent
          ),
        data: { contentEditorMode: 'create' as const }
      },
      {
        path: 'content/:slug/history',
        loadComponent: () =>
          import('@features/content/content-history-page/content-history-page.component').then(
            (m) => m.ContentHistoryPageComponent
          )
      },
      {
        path: 'content/:slug/edit',
        loadComponent: () =>
          import('@features/content/content-editor-page/content-editor-page.component').then(
            (m) => m.ContentEditorPageComponent
          ),
        data: { contentEditorMode: 'edit' as const }
      },
      {
        path: 'content',
        loadComponent: () =>
          import('@features/content/content-list/content-list.component').then(
            (m) => m.ContentListComponent
          )
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('@features/categories/category-list/category-list.component').then(
            (m) => m.CategoryListComponent
          )
      },
      {
        path: 'categories/new',
        loadComponent: () =>
          import('@features/categories/category-form/category-form.component').then(
            (m) => m.CategoryFormComponent
          )
      },
      {
        path: 'categories/:id/edit',
        loadComponent: () =>
          import('@features/categories/category-form/category-form.component').then(
            (m) => m.CategoryFormComponent
          )
      },
      {
        path: 'products',
        loadComponent: () =>
          import('@features/products/product-list/product-list.component').then(
            (m) => m.ProductListComponent
          )
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('@features/products/product-form/product-form.component').then(
            (m) => m.ProductFormComponent
          )
      },
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('@features/products/product-form/product-form.component').then(
            (m) => m.ProductFormComponent
          )
      },
      {
        path: 'client-types',
        loadComponent: () =>
          import('@features/clients/client-type-list/client-type-list.component').then(
            (m) => m.ClientTypeListComponent
          )
      },
      {
        path: 'client-types/new',
        loadComponent: () =>
          import('@features/clients/client-type-form/client-type-form.component').then(
            (m) => m.ClientTypeFormComponent
          )
      },
      {
        path: 'client-types/:id/edit',
        loadComponent: () =>
          import('@features/clients/client-type-form/client-type-form.component').then(
            (m) => m.ClientTypeFormComponent
          )
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('@features/clients/client-list/client-list.component').then((m) => m.ClientListComponent)
      },
      {
        path: 'clients/new',
        loadComponent: () =>
          import('@features/clients/client-form/client-form.component').then((m) => m.ClientFormComponent)
      },
      {
        path: 'clients/:id/edit',
        loadComponent: () =>
          import('@features/clients/client-form/client-form.component').then((m) => m.ClientFormComponent)
      },
      {
        path: 'inventory/adjust',
        loadComponent: () =>
          import('@features/inventory/inventory-adjust/inventory-adjust-page.component').then(
            (m) => m.InventoryAdjustPageComponent
          )
      },
      {
        path: 'inventory/history',
        loadComponent: () =>
          import('@features/inventory/inventory-history/inventory-history-page.component').then(
            (m) => m.InventoryHistoryPageComponent
          )
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('@features/inventory/inventory-list/inventory-list.component').then(
            (m) => m.InventoryListComponent
          )
      },
      {
        path: 'orders/analytics',
        loadComponent: () =>
          import('@features/orders/order-analytics/order-analytics-page.component').then(
            (m) => m.OrderAnalyticsPageComponent
          )
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('@features/orders/order-list/order-list.component').then((m) => m.OrderListComponent)
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('@features/orders/order-detail/order-detail.component').then((m) => m.OrderDetailComponent)
      },
      {
        path: 'contact-messages',
        loadComponent: () =>
          import('@features/contact/pages/contact-messages-page.component').then(
            (m) => m.ContactMessagesPageComponent
          )
      },
      {
        path: 'contact-recipients',
        loadComponent: () =>
          import('@features/contact/pages/contact-recipients-page.component').then(
            (m) => m.ContactRecipientsPageComponent
          )
      },
      {
        path: 'admin-approvals',
        loadComponent: () =>
          import('@features/admin-approvals/pages/admin-approvals-page.component').then(
            (m) => m.AdminApprovalsPageComponent
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
