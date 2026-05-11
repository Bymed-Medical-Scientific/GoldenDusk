import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  catchError,
  EMPTY,
  finalize,
  interval,
  startWith,
  Subscription,
  switchMap,
  takeWhile,
  tap
} from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import {
  ClientTypeDto,
  MarketingCampaignPreviewDto,
  MarketingCampaignStatusDto
} from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-marketing-campaigns-page',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    MultiSelectModule,
    TableModule,
    TextareaModule
  ],
  templateUrl: './marketing-campaigns-page.component.html',
  styleUrl: './marketing-campaigns-page.component.scss'
})
export class MarketingCampaignsPageComponent implements OnDestroy {
  private readonly adminApi = inject(AdminApiService);

  protected readonly isBusy = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly clientTypes = signal<ClientTypeDto[]>([]);
  protected readonly campaignId = signal<string | null>(null);

  protected subject = '';
  protected htmlBody = '';
  protected selectedClientTypeIds: string[] = [];
  protected includeInstitutionEmails = true;
  protected includeContactPerson1Email = false;
  protected includeContactPerson2Email = false;

  protected attachmentFiles: File[] = [];
  protected readonly preview = signal<MarketingCampaignPreviewDto | null>(null);
  protected readonly status = signal<MarketingCampaignStatusDto | null>(null);

  private statusPoll?: Subscription;

  public constructor() {
    this.adminApi
      .getClientTypes()
      .pipe(
        catchError(() => {
          this.errorMessage.set('Could not load client types.');
          return EMPTY;
        })
      )
      .subscribe((types) => this.clientTypes.set(types));
  }

  public ngOnDestroy(): void {
    this.statusPoll?.unsubscribe();
  }

  protected createDraft(): void {
    this.errorMessage.set(null);
    if (!this.subject.trim()) {
      this.errorMessage.set('Subject is required.');
      return;
    }
    if (this.selectedClientTypeIds.length === 0) {
      this.errorMessage.set('Select at least one client type.');
      return;
    }
    if (!this.includeInstitutionEmails && !this.includeContactPerson1Email && !this.includeContactPerson2Email) {
      this.errorMessage.set('Select at least one recipient group.');
      return;
    }

    this.isBusy.set(true);
    this.adminApi
      .createMarketingCampaign({
        subject: this.subject.trim(),
        htmlBody: this.htmlBody.trim() || null,
        clientTypeIds: this.selectedClientTypeIds,
        includeInstitutionEmails: this.includeInstitutionEmails,
        includeContactPerson1Email: this.includeContactPerson1Email,
        includeContactPerson2Email: this.includeContactPerson2Email
      })
      .pipe(
        catchError(() => {
          this.errorMessage.set('Could not create campaign draft.');
          return EMPTY;
        }),
        finalize(() => this.isBusy.set(false))
      )
      .subscribe((detail) => {
        this.campaignId.set(detail.id);
        this.preview.set(null);
        this.status.set(null);
      });
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.attachmentFiles = input.files ? Array.from(input.files) : [];
  }

  protected uploadAttachments(): void {
    const id = this.campaignId();
    if (!id) {
      this.errorMessage.set('Create a draft first.');
      return;
    }
    if (this.attachmentFiles.length === 0) {
      this.errorMessage.set('Choose one or more files.');
      return;
    }

    this.errorMessage.set(null);
    this.isBusy.set(true);
    this.adminApi
      .addMarketingCampaignAttachments(id, this.attachmentFiles)
      .pipe(
        catchError(() => {
          this.errorMessage.set('Upload failed.');
          return EMPTY;
        }),
        finalize(() => this.isBusy.set(false))
      )
      .subscribe(() => {
        this.attachmentFiles = [];
      });
  }

  protected loadPreview(): void {
    const id = this.campaignId();
    if (!id) {
      this.errorMessage.set('Create a draft first.');
      return;
    }
    this.errorMessage.set(null);
    this.isBusy.set(true);
    this.adminApi
      .getMarketingCampaignPreview(id)
      .pipe(
        catchError(() => {
          this.errorMessage.set('Could not load preview.');
          return EMPTY;
        }),
        finalize(() => this.isBusy.set(false))
      )
      .subscribe((p) => this.preview.set(p));
  }

  protected startCampaign(): void {
    const id = this.campaignId();
    if (!id) {
      this.errorMessage.set('Create a draft first.');
      return;
    }
    this.errorMessage.set(null);
    this.isBusy.set(true);
    this.adminApi
      .startMarketingCampaign(id)
      .pipe(
        catchError(() => {
          this.errorMessage.set('Could not start campaign.');
          return EMPTY;
        }),
        finalize(() => this.isBusy.set(false))
      )
      .subscribe(() => {
        this.beginStatusPolling(id);
      });
  }

  private beginStatusPolling(id: string): void {
    this.statusPoll?.unsubscribe();
    this.statusPoll = interval(2000)
      .pipe(
        startWith(0),
        switchMap(() => this.adminApi.getMarketingCampaignStatus(id)),
        tap((s) => this.status.set(s)),
        takeWhile((s) => s.status === 'Sending', true)
      )
      .subscribe({
        error: () => this.errorMessage.set('Status polling failed.')
      });
  }

  protected refreshStatus(): void {
    const id = this.campaignId();
    if (!id) {
      return;
    }
    this.adminApi.getMarketingCampaignStatus(id).subscribe({
      next: (s) => this.status.set(s),
      error: () => this.errorMessage.set('Could not load status.')
    });
  }
}
