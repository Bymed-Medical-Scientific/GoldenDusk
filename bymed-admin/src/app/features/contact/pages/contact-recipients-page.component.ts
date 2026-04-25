import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ContactNotificationRecipientDto } from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-contact-recipients-page',
  standalone: true,
  imports: [DatePipe, FormsModule, ButtonModule, ProgressSpinnerModule],
  templateUrl: './contact-recipients-page.component.html',
  styleUrl: './contact-recipients-page.component.scss'
})
export class ContactRecipientsPageComponent implements OnInit {
  protected readonly isLoading = signal(true);
  protected readonly rows = signal<ContactNotificationRecipientDto[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
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
      this.errorMessage.set('Email is required.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.adminApi
      .createContactNotificationRecipient({ email, isPrimaryRecipient: this.isPrimaryRecipient })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.email = '';
          this.isPrimaryRecipient = false;
          this.load();
        },
        error: (error: { message?: string }) => {
          this.errorMessage.set(error.message ?? 'Failed to add recipient.');
        }
      });
  }

  protected toggleRecipientStatus(recipientId: string, isActive: boolean): void {
    if (this.togglingIds().has(recipientId)) {
      return;
    }

    const next = new Set(this.togglingIds());
    next.add(recipientId);
    this.togglingIds.set(next);

    const request$ = isActive
      ? this.adminApi.deactivateContactNotificationRecipient(recipientId)
      : this.adminApi.activateContactNotificationRecipient(recipientId);

    request$.subscribe({
      next: () => {
        const done = new Set(this.togglingIds());
        done.delete(recipientId);
        this.togglingIds.set(done);
        this.load();
      },
      error: (error: { message?: string }) => {
        const done = new Set(this.togglingIds());
        done.delete(recipientId);
        this.togglingIds.set(done);
        this.errorMessage.set(
          error.message ?? (isActive ? 'Failed to deactivate recipient.' : 'Failed to activate recipient.')
        );
      }
    });
  }

  protected isToggling(recipientId: string): boolean {
    return this.togglingIds().has(recipientId);
  }

  private load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.adminApi
      .getContactNotificationRecipients()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (rows) => this.rows.set(rows),
        error: (error: { message?: string }) => {
          this.rows.set([]);
          this.errorMessage.set(error.message ?? 'Failed to load recipients.');
        }
      });
  }
}
