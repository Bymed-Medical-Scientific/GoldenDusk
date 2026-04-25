import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { QuoteRequestDto } from '@shared/models';

@Component({
  selector: 'app-quote-requests-page',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './quote-requests-page.component.html'
})
export class QuoteRequestsPageComponent implements OnInit {
  protected readonly isLoading = signal(true);
  protected readonly rows = signal<QuoteRequestDto[]>([]);
  protected readonly errorMessage = signal<string | null>(null);

  public constructor(private readonly adminApi: AdminApiService) {}

  public ngOnInit(): void {
    this.refresh();
  }

  protected refresh(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.adminApi
      .getQuoteRequests(1, 50)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (result) => this.rows.set(result.items),
        error: (error: { message?: string }) => {
          this.rows.set([]);
          this.errorMessage.set(error.message ?? 'Failed to load quote requests.');
        }
      });
  }
}
