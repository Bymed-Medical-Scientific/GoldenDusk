import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { PendingAdminRegistrationDto, PendingCustomerRegistrationDto } from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-admin-approvals-page',
  standalone: true,
  imports: [DatePipe, ButtonModule, ProgressSpinnerModule],
  templateUrl: './admin-approvals-page.component.html',
  styleUrl: './admin-approvals-page.component.scss'
})
export class AdminApprovalsPageComponent implements OnInit {
  protected readonly isLoading = signal(true);
  protected readonly rows = signal<PendingAdminRegistrationDto[]>([]);
  protected readonly customerRows = signal<PendingCustomerRegistrationDto[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
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

    this.adminApi
      .approvePendingAdminRegistration(userId)
      .pipe(
        finalize(() => {
          const done = new Set(this.approvingIds());
          done.delete(userId);
          this.approvingIds.set(done);
        })
      )
      .subscribe({
        next: () => {
          this.rows.set(this.rows().filter((row) => row.id !== userId));
        },
        error: (error: { message?: string }) => {
          this.errorMessage.set(error.message ?? 'Failed to approve this admin account.');
        }
      });
  }

  protected approveCustomer(userId: string, canViewPrices: boolean): void {
    const next = new Set(this.approvingIds());
    next.add(userId);
    this.approvingIds.set(next);

    this.adminApi
      .approvePendingCustomerRegistration(userId, canViewPrices)
      .pipe(
        finalize(() => {
          const done = new Set(this.approvingIds());
          done.delete(userId);
          this.approvingIds.set(done);
        })
      )
      .subscribe({
        next: () => {
          this.customerRows.set(this.customerRows().filter((row) => row.id !== userId));
        },
        error: (error: { message?: string }) => {
          this.errorMessage.set(error.message ?? 'Failed to approve this customer account.');
        }
      });
  }

  protected declineCustomer(userId: string): void {
    const next = new Set(this.decliningIds());
    next.add(userId);
    this.decliningIds.set(next);

    this.adminApi
      .declinePendingCustomerRegistration(userId)
      .pipe(
        finalize(() => {
          const done = new Set(this.decliningIds());
          done.delete(userId);
          this.decliningIds.set(done);
        })
      )
      .subscribe({
        next: () => {
          this.customerRows.set(this.customerRows().filter((row) => row.id !== userId));
        },
        error: (error: { message?: string }) => {
          this.errorMessage.set(error.message ?? 'Failed to decline this customer account.');
        }
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
    this.adminApi.getPendingAdminRegistrations().subscribe({
        next: (rows) => {
          this.rows.set(rows);
        },
        error: (error: { message?: string }) => {
          this.rows.set([]);
          this.errorMessage.set(error.message ?? 'Failed to load pending admin registrations.');
        }
      });
    this.adminApi
      .getPendingCustomerRegistrations()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (rows) => this.customerRows.set(rows),
        error: (error: { message?: string }) => {
          this.customerRows.set([]);
          this.errorMessage.set(error.message ?? 'Failed to load pending customer registrations.');
        }
      });
  }
}
