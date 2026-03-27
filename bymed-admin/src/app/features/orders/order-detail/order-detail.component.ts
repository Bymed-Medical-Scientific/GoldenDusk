import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { PageLoadingComponent } from '@shared/components/page-loading/page-loading.component';
import { OrderDetailDto } from '@shared/models';
import { orderStatusChipClass, orderStatusLabel } from '@shared/utils/order-status';
import { paymentStatusLabel } from '@shared/utils/payment-status';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    GlobalErrorComponent,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
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

  protected readonly isLoading = signal(true);
  protected readonly notFoundMessage = signal<string | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly order = signal<OrderDetailDto | null>(null);

  protected readonly orderStatusLabel = orderStatusLabel;
  protected readonly orderStatusChipClass = orderStatusChipClass;
  protected readonly paymentStatusLabel = paymentStatusLabel;

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
      .subscribe((o) => this.order.set(o));
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
