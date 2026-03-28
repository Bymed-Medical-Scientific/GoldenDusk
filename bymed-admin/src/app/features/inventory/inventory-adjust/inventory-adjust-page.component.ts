import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  filter,
  finalize,
  map,
  of,
  switchMap
} from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { LowStockAlertsService } from '@core/inventory/low-stock-alerts.service';
import { ApiError } from '@core/api/api-error';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { ProductDto } from '@shared/models';

const REASON_MAX = 500;

const GUID_LIKE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Component({
  selector: 'app-inventory-adjust-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    GlobalErrorComponent,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './inventory-adjust-page.component.html',
  styleUrl: './inventory-adjust-page.component.scss'
})
export class InventoryAdjustPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminApi = inject(AdminApiService);
  private readonly lowStockAlerts = inject(LowStockAlertsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly productSearch = this.fb.nonNullable.control('');
  protected readonly adjustForm = this.fb.nonNullable.group({
    newStockCount: this.fb.nonNullable.control<number>(0, {
      validators: [Validators.required, Validators.min(0)]
    }),
    reason: this.fb.nonNullable.control('', {
      validators: [Validators.required, Validators.maxLength(REASON_MAX)]
    })
  });

  protected readonly selectedProduct = signal<ProductDto | null>(null);
  protected readonly searchResults = signal<ProductDto[]>([]);
  protected readonly isSearchingProducts = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly pageError = signal<string | null>(null);

  protected readonly reasonMaxLength = REASON_MAX;

  public ngOnInit(): void {
    this.productSearch.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (this.selectedProduct()) {
            this.searchResults.set([]);
            return of(null);
          }
          const t = term.trim();
          if (GUID_LIKE.test(t)) {
            this.searchResults.set([]);
            return of(null);
          }
          if (t.length < 2) {
            this.searchResults.set([]);
            return of(null);
          }
          this.isSearchingProducts.set(true);
          return this.adminApi.getProducts(1, 30, { search: t }).pipe(
            map((page) => page.items),
            catchError(() => {
              this.searchResults.set([]);
              return of(null);
            }),
            finalize(() => this.isSearchingProducts.set(false))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((items) => {
        if (items !== null) {
          this.searchResults.set(items);
        }
      });

    this.productSearch.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((term) => {
      const p = this.selectedProduct();
      if (!p) {
        return;
      }
      const label = `${p.name} (${p.sku})`;
      if (term.trim() !== label.trim()) {
        this.selectedProduct.set(null);
        this.searchResults.set([]);
        this.adjustForm.reset({ newStockCount: 0, reason: '' });
      }
    });
  }

  protected onProductOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const id = event.option.value as string;
    const product = this.searchResults().find((x) => x.id === id);
    if (!product) {
      return;
    }
    this.selectedProduct.set(product);
    this.searchResults.set([]);
    this.productSearch.setValue(`${product.name} (${product.sku})`, { emitEvent: false });
    this.adjustForm.patchValue({
      newStockCount: product.inventoryCount,
      reason: ''
    });
    this.pageError.set(null);
  }

  /** Reset product picker and form (toolbar action). */
  protected clearProductSelection(): void {
    this.selectedProduct.set(null);
    this.searchResults.set([]);
    this.productSearch.setValue('');
    this.adjustForm.reset({ newStockCount: 0, reason: '' });
  }

  protected promptSubmit(): void {
    const product = this.selectedProduct();
    if (!product || this.adjustForm.invalid || this.isSubmitting()) {
      this.adjustForm.markAllAsTouched();
      return;
    }

    const raw = this.adjustForm.getRawValue();
    const newCount = Math.floor(Number(raw.newStockCount));
    const reason = raw.reason.trim();
    if (reason.length === 0) {
      return;
    }

    const adjustment = newCount - product.inventoryCount;
    if (adjustment === 0) {
      this.snackBar.open('New stock count matches the current level. Enter a different value.', 'Dismiss', {
        duration: 6000
      });
      return;
    }

    const sign = adjustment > 0 ? '+' : '';
    const data: ConfirmDialogData = {
      title: 'Confirm inventory adjustment',
      message: `Product: ${product.name} (SKU ${product.sku}). Current: ${product.inventoryCount}. New: ${newCount}. Change: ${sign}${adjustment}. Reason: ${reason}`,
      confirmLabel: 'Apply adjustment',
      confirmColor: 'primary'
    };

    this.dialog
      .open(ConfirmDialogComponent, { data, width: 'min(520px, 92vw)' })
      .afterClosed()
      .pipe(filter((confirmed) => confirmed === true))
      .subscribe(() => this.applyAdjustment(product.id, adjustment, reason));
  }

  private applyAdjustment(productId: string, adjustment: number, reason: string): void {
    this.isSubmitting.set(true);
    this.pageError.set(null);

    this.adminApi
      .adjustInventory(productId, { adjustment, reason })
      .pipe(
        catchError((err: unknown) => {
          if (err instanceof ApiError) {
            if (err.validationErrors?.length) {
              this.pageError.set(err.validationErrors.map((e) => e.errorMessage).join(' '));
            } else {
              this.pageError.set(err.message);
            }
            this.snackBar.open(err.message, 'Dismiss', { duration: 8000 });
          } else {
            this.pageError.set('Could not adjust inventory. Please try again.');
            this.snackBar.open('Could not adjust inventory.', 'Dismiss', { duration: 8000 });
          }
          return EMPTY;
        }),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe((updated) => {
        this.lowStockAlerts.refresh();
        const prev = this.selectedProduct();
        if (prev && prev.id === updated.productId) {
          this.selectedProduct.set({
            ...prev,
            inventoryCount: updated.inventoryCount,
            lowStockThreshold: updated.lowStockThreshold,
            isAvailable: updated.isAvailable
          });
          this.productSearch.setValue(`${prev.name} (${prev.sku})`, { emitEvent: false });
        }
        this.adjustForm.patchValue({
          newStockCount: updated.inventoryCount,
          reason: ''
        });
        this.snackBar.open('Inventory updated.', 'Dismiss', { duration: 4000 });
      });
  }

  protected reasonLength(): number {
    return this.adjustForm.controls.reason.value.length;
  }
}
