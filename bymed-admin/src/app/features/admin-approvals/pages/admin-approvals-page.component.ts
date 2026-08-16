import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { catchError, EMPTY, finalize, forkJoin } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { PendingAdminRegistrationDto, PendingCustomerRegistrationDto } from '@shared/models';

@Component({
  selector: 'app-admin-approvals-page',
  standalone: true,
  imports: [DatePipe, GlobalErrorComponent, TableSkeletonComponent],
  templateUrl: './admin-approvals-page.component.html',
  styleUrl: './admin-approvals-page.component.scss'
})
export class AdminApprovalsPageComponent implements OnInit {
  protected readonly isLoading = signal(true);
  protected readonly rows = signal<PendingAdminRegistrationDto[]>([]);
  protected readonly customerRows = signal<PendingCustomerRegistrationDto[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pageMessage = signal<string | null>(null);
  protected readonly approvingIds = signal<Set<string>>(new Set<string>());
  protected readonly decliningIds = signal<Set<string>>(new Set<string>());

  public constructor(private readonly adminApi: AdminApiService) {}

  public ngOnInit(): void {
    this.loadPending();
  }

  protected approve(userId: string): void {
    if (this.approvingIds().has(userId)) {
      return;
    }

    const next = new Set(this.approvingIds());
    next.add(userId);
    this.approvingIds.set(next);
    this.pageMessage.set(null);

    this.adminApi
      .approvePendingAdminRegistration(userId)
      .pipe(
        catchError((error: { message?: string }) => {
          this.pageMessage.set(error.message ?? 'Failed to approve this admin account.');
          return EMPTY;
        }),
        finalize(() => {
          const done = new Set(this.approvingIds());
          done.delete(userId);
          this.approvingIds.set(done);
        })
      )
      .subscribe(() => {
        this.rows.set(this.rows().filter((row) => row.id !== userId));
      });
  }

  protected approveCustomer(userId: string, canViewPrices: boolean): void {
    if (this.approvingIds().has(userId)) {
      return;
    }

    const next = new Set(this.approvingIds());
    next.add(userId);
    this.approvingIds.set(next);
    this.pageMessage.set(null);

    this.adminApi
      .approvePendingCustomerRegistration(userId, canViewPrices)
      .pipe(
        catchError((error: { message?: string }) => {
          this.pageMessage.set(error.message ?? 'Failed to approve this customer account.');
          return EMPTY;
        }),
        finalize(() => {
          const done = new Set(this.approvingIds());
          done.delete(userId);
          this.approvingIds.set(done);
        })
      )
      .subscribe(() => {
        this.customerRows.set(this.customerRows().filter((row) => row.id !== userId));
      });
  }

  protected declineCustomer(userId: string): void {
    if (this.decliningIds().has(userId)) {
      return;
    }

    const next = new Set(this.decliningIds());
    next.add(userId);
    this.decliningIds.set(next);
    this.pageMessage.set(null);

    this.adminApi
      .declinePendingCustomerRegistration(userId)
      .pipe(
        catchError((error: { message?: string }) => {
          this.pageMessage.set(error.message ?? 'Failed to decline this customer account.');
          return EMPTY;
        }),
        finalize(() => {
          const done = new Set(this.decliningIds());
          done.delete(userId);
          this.decliningIds.set(done);
        })
      )
      .subscribe(() => {
        this.customerRows.set(this.customerRows().filter((row) => row.id !== userId));
      });
  }

  protected isApproving(userId: string): boolean {
    return this.approvingIds().has(userId);
  }

  protected isDeclining(userId: string): boolean {
    return this.decliningIds().has(userId);
  }

  protected refresh(): void {
    this.loadPending();
  }

  private loadPending(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      admins: this.adminApi.getPendingAdminRegistrations(),
      customers: this.adminApi.getPendingCustomerRegistrations()
    })
      .pipe(
        catchError(() => {
          this.errorMessage.set('Pending approvals could not be loaded. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(({ admins, customers }) => {
        this.rows.set(admins);
        this.customerRows.set(customers);
      });
  }
}
