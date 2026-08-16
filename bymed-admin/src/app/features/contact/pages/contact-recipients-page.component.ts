import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { ContactNotificationRecipientDto } from '@shared/models';

@Component({
  selector: 'app-contact-recipients-page',
  standalone: true,
  imports: [DatePipe, FormsModule, GlobalErrorComponent, TableSkeletonComponent],
  templateUrl: './contact-recipients-page.component.html',
  styleUrl: './contact-recipients-page.component.scss'
})
export class ContactRecipientsPageComponent implements OnInit {
  protected readonly isLoading = signal(true);
  protected readonly rows = signal<ContactNotificationRecipientDto[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pageMessage = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly togglingIds = signal<Set<string>>(new Set<string>());

  protected email = '';
  protected isPrimaryRecipient = false;

  public constructor(private readonly adminApi: AdminApiService) {}

  public ngOnInit(): void {
    this.load();
  }

  protected refresh(): void {
    this.load();
  }

  protected create(): void {
    const email = this.email.trim();
    if (!email) {
      this.pageMessage.set('Email is required.');
      return;
    }

    this.submitting.set(true);
    this.pageMessage.set(null);
    this.adminApi
      .createContactNotificationRecipient({ email, isPrimaryRecipient: this.isPrimaryRecipient })
      .pipe(
        catchError((error: { message?: string }) => {
          this.pageMessage.set(error.message ?? 'Failed to add recipient.');
          return EMPTY;
        }),
        finalize(() => this.submitting.set(false))
      )
      .subscribe(() => {
        this.email = '';
        this.isPrimaryRecipient = false;
        this.load();
      });
  }

  protected toggleRecipientStatus(recipientId: string, isActive: boolean): void {
    if (this.togglingIds().has(recipientId)) {
      return;
    }

    const next = new Set(this.togglingIds());
    next.add(recipientId);
    this.togglingIds.set(next);
    this.pageMessage.set(null);

    const request$ = isActive
      ? this.adminApi.deactivateContactNotificationRecipient(recipientId)
      : this.adminApi.activateContactNotificationRecipient(recipientId);

    request$
      .pipe(
        catchError((error: { message?: string }) => {
          this.pageMessage.set(
            error.message ?? (isActive ? 'Failed to deactivate recipient.' : 'Failed to activate recipient.')
          );
          return EMPTY;
        }),
        finalize(() => {
          const done = new Set(this.togglingIds());
          done.delete(recipientId);
          this.togglingIds.set(done);
        })
      )
      .subscribe(() => this.load());
  }

  protected isToggling(recipientId: string): boolean {
    return this.togglingIds().has(recipientId);
  }

  private load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.adminApi
      .getContactNotificationRecipients()
      .pipe(
        catchError(() => {
          this.errorMessage.set('Recipients could not be loaded. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((rows) => this.rows.set(rows));
  }
}
