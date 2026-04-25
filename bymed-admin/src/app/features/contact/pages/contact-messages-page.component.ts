import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ContactMessageDto, PagedResultDto } from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-contact-messages-page',
  standalone: true,
  imports: [DatePipe, FormsModule, ButtonModule, ProgressSpinnerModule],
  templateUrl: './contact-messages-page.component.html',
  styleUrl: './contact-messages-page.component.scss'
})
export class ContactMessagesPageComponent implements OnInit {
  protected readonly isLoading = signal(true);
  protected readonly rows = signal<ContactMessageDto[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly totalCount = signal(0);
  protected emailFilter = '';
  protected subjectFilter = '';
  protected dateFromFilter = '';
  protected dateToFilter = '';

  public constructor(private readonly adminApi: AdminApiService) {}

  public ngOnInit(): void {
    this.load();
  }

  protected refresh(): void {
    this.load();
  }

  protected applyFilters(): void {
    this.pageNumber.set(1);
    this.load();
  }

  protected clearFilters(): void {
    this.emailFilter = '';
    this.subjectFilter = '';
    this.dateFromFilter = '';
    this.dateToFilter = '';
    this.pageNumber.set(1);
    this.load();
  }

  protected nextPage(): void {
    if (this.pageNumber() * this.pageSize() >= this.totalCount()) {
      return;
    }
    this.pageNumber.update((x) => x + 1);
    this.load();
  }

  protected previousPage(): void {
    if (this.pageNumber() <= 1) {
      return;
    }
    this.pageNumber.update((x) => x - 1);
    this.load();
  }

  protected hasPrevious(): boolean {
    return this.pageNumber() > 1;
  }

  protected hasNext(): boolean {
    return this.pageNumber() * this.pageSize() < this.totalCount();
  }

  protected totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize()));
  }

  private load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.adminApi
      .getContactMessages(this.pageNumber(), this.pageSize(), {
        email: this.emailFilter,
        subject: this.subjectFilter,
        dateFromUtc: this.toUtcIsoStart(this.dateFromFilter),
        dateToUtc: this.toUtcIsoEnd(this.dateToFilter)
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (result: PagedResultDto<ContactMessageDto>) => {
          this.rows.set(result.items);
          this.totalCount.set(result.totalCount);
        },
        error: (error: { message?: string }) => {
          this.rows.set([]);
          this.errorMessage.set(error.message ?? 'Failed to load contact messages.');
        }
      });
  }

  private toUtcIsoStart(value: string): string | null {
    if (!value?.trim()) {
      return null;
    }

    const localDate = new Date(`${value}T00:00:00`);
    return Number.isNaN(localDate.getTime()) ? null : localDate.toISOString();
  }

  private toUtcIsoEnd(value: string): string | null {
    if (!value?.trim()) {
      return null;
    }

    const localDate = new Date(`${value}T23:59:59.999`);
    return Number.isNaN(localDate.getTime()) ? null : localDate.toISOString();
  }
}
