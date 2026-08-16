import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { GlobalErrorComponent } from '@shared/components/global-error/global-error.component';
import { TablePaginationComponent, TablePageChange } from '@shared/components/table-pagination/table-pagination.component';
import { TableSkeletonComponent } from '@shared/components/table-skeleton/table-skeleton.component';
import { ContactMessageDto } from '@shared/models';

@Component({
  selector: 'app-contact-messages-page',
  standalone: true,
  imports: [DatePipe, FormsModule, GlobalErrorComponent, TablePaginationComponent, TableSkeletonComponent],
  templateUrl: './contact-messages-page.component.html',
  styleUrl: './contact-messages-page.component.scss'
})
export class ContactMessagesPageComponent implements OnInit {
  protected readonly isLoading = signal(true);
  protected readonly rows = signal<ContactMessageDto[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pageNumber = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly totalCount = signal(0);
  protected readonly pageSizeOptions = [10, 20, 50];
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

  protected onPageChange(event: TablePageChange): void {
    this.pageNumber.set(event.pageNumber);
    this.pageSize.set(event.pageSize);
    this.load();
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
      .pipe(
        catchError(() => {
          this.errorMessage.set('Contact messages could not be loaded. Please try again.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((result) => {
        this.rows.set(result.items);
        this.totalCount.set(result.totalCount);
        this.pageNumber.set(result.pageNumber);
        this.pageSize.set(result.pageSize);
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
