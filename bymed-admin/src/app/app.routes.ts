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
