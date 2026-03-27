import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { PageLoadingComponent } from '@shared/components/page-loading/page-loading.component';
import { OrderDetailDto, UpdateOrderStatusRequestDto } from '@shared/models';
import { allowedNextOrderStatuses, orderStatusChipClass, orderStatusLabel } from '@shared/utils/order-status';
import { paymentStatusLabel } from '@shared/utils/payment-status';

/** `OrderStatus.Shipped` */
const STATUS_SHIPPED = 2;
/** `OrderStatus.Cancelled` */
const STATUS_CANCELLED = 4;

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    GlobalErrorComponent,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    NgClass,
    PageLoadingComponent,
    RouterLink
  ],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss'
})
export class OrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly adminApi = inject(AdminApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(true);
  protected readonly notFoundMessage = signal<string | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly order = signal<OrderDetailDto | null>(null);

  protected readonly selectedNextStatus = signal<number | null>(null);
  protected readonly trackingDraft = signal('');
  protected readonly notesDraft = signal('');
  protected readonly statusFormError = signal<string | null>(null);
  protected readonly isSavingStatus = signal(false);

  protected readonly orderStatusLabel = orderStatusLabel;
  protected readonly orderStatusChipClass = orderStatusChipClass;
  protected readonly paymentStatusLabel = paymentStatusLabel;
  protected readonly allowedNextOrderStatuses = allowedNextOrderStatuses;

  protected readonly lineColumns: string[] = ['product', 'quantity', 'unitPrice', 'lineTotal'];

  public ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFoundMessage.set('Order not found.');
      this.isLoading.set(false);
      return;
    }

    this.adminApi
      .getOrderById(id)
      .pipe(
        catchError((err: unknown) => {
          if (err instanceof ApiError && err.statusCode === 404) {
            this.notFoundMessage.set('This order was not found.');
          } else {
            this.loadError.set('The order could not be loaded. Please try again.');
          }
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((o) => {
        this.order.set(o);
        this.syncStatusFormFromOrder(o);
      });
  }

  protected onNextStatusPick(value: number | string | null | undefined): void {
    if (value === null || value === undefined || value === '') {
      this.selectedNextStatus.set(null);
    } else {
      const n = typeof value === 'string' ? Number.parseInt(value, 10) : value;
      this.selectedNextStatus.set(Number.isNaN(n) ? null : n);
    }
    this.statusFormError.set(null);
    if (this.selectedNextStatus() !== STATUS_SHIPPED) {
      this.trackingDraft.set('');
    }
  }

  protected requiresTrackingForShippedSelection(): boolean {
    return this.selectedNextStatus() === STATUS_SHIPPED;
  }

  protected canApplyStatus(): boolean {
    const next = this.selectedNextStatus();
    if (next === null) {
      return false;
    }
    if (next === STATUS_SHIPPED && !this.trackingDraft().trim()) {
      return false;
    }
    return !this.isSavingStatus();
  }

  protected promptApplyStatus(o: OrderDetailDto): void {
    const next = this.selectedNextStatus();
    if (next === null) {
      return;
    }

    if (next === STATUS_SHIPPED && !this.trackingDraft().trim()) {
      this.statusFormError.set('Tracking number is required when marking the order as shipped.');
      return;
    }
    this.statusFormError.set(null);

    const from = orderStatusLabel(o.status);
    const to = orderStatusLabel(next);
    const tracking = this.trackingDraft().trim();
    const notes = this.notesDraft().trim();

    let message = `Change order status from "${from}" to "${to}"?`;
    if (next === STATUS_SHIPPED) {
      message += ` Tracking: ${tracking}.`;
    }
    if (notes.length > 0) {
      message += ` Notes will be saved.`;
    }
    if (next === STATUS_CANCELLED) {
      message += ' This cannot be undone from the admin UI.';
    }

    const data: ConfirmDialogData = {
      title: next === STATUS_CANCELLED ? 'Cancel this order?' : 'Confirm status change',
      message,
      confirmLabel: next === STATUS_CANCELLED ? 'Cancel order' : 'Update status',
      confirmColor: next === STATUS_CANCELLED ? 'warn' : 'primary'
    };

    this.dialog
      .open(ConfirmDialogComponent, { data, width: 'min(520px, 92vw)' })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed !== true) {
          return;
        }
        this.sendStatusUpdate(o.id, next);
      });
  }

  private sendStatusUpdate(orderId: string, next: number): void {
    const tracking = this.trackingDraft().trim();
    const notes = this.notesDraft().trim();

    const body: UpdateOrderStatusRequestDto = {
      status: next,
      ...(next === STATUS_SHIPPED ? { trackingNumber: tracking } : {}),
      ...(notes.length > 0 ? { notes } : {})
    };

    this.isSavingStatus.set(true);
    this.adminApi
      .updateOrderStatus(orderId, body)
      .pipe(
        catchError((err: unknown) => {
          const message =
            err instanceof ApiError ? err.message : 'Could not update order status. Please try again.';
          this.snackBar.open(message, 'Dismiss', { duration: 8000 });
          return EMPTY;
        }),
        finalize(() => this.isSavingStatus.set(false))
      )
      .subscribe((updated) => {
        this.order.set(updated);
        this.syncStatusFormFromOrder(updated);
        this.snackBar.open('Order status updated.', 'Dismiss', { duration: 4000 });
      });
  }

  private syncStatusFormFromOrder(o: OrderDetailDto): void {
    this.selectedNextStatus.set(null);
    this.trackingDraft.set('');
    this.notesDraft.set(o.notes ?? '');
    this.statusFormError.set(null);
  }

  protected hasMeaningfulLastUpdate(o: OrderDetailDto): boolean {
    if (!o.lastModificationTime) {
      return false;
    }
    return (
      new Date(o.lastModificationTime).getTime() !== new Date(o.creationTime).getTime()
    );
  }

  protected formatAddress(o: OrderDetailDto): string[] {
    const a = o.shippingAddress;
    const lines = [a.addressLine1];
    if (a.addressLine2?.trim()) {
      lines.push(a.addressLine2.trim());
    }
    lines.push(`${a.city}, ${a.state} ${a.postalCode}`);
    lines.push(a.country);
    return lines;
  }
}
