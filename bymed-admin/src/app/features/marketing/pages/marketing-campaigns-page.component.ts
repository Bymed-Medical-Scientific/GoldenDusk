import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewChild, inject, signal } from '@angular/core';
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
import { ApiError } from '@core/api/api-error';
import {
  ClientTypeDto,
  MarketingCampaignPreviewDto,
  MarketingCampaignStatusDto
} from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { FileUpload } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';

/** Matches defaults in Bymed.Application.Marketing.MarketingOptions (server still enforces). */
const MAX_ATTACHMENT_BYTES_PER_FILE = 10 * 1024 * 1024;
const MAX_ATTACHMENTS_PER_CAMPAIGN = 5;
const MAX_TOTAL_ATTACHMENT_MB = 25;

@Component({
  selector: 'app-marketing-campaigns-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    FileUpload,
    InputTextModule,
    Message,
    MultiSelectModule,
    TableModule,
    TextareaModule
  ],
  templateUrl: './marketing-campaigns-page.component.html',
  styleUrl: './marketing-campaigns-page.component.scss'
})
export class MarketingCampaignsPageComponent implements OnDestroy {
  private readonly adminApi = inject(AdminApiService);

  @ViewChild('attachmentUpload') private attachmentUpload?: FileUpload;

  protected readonly isBusy = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly uploadNotice = signal<string | null>(null);
  protected readonly clientTypes = signal<ClientTypeDto[]>([]);
  protected readonly campaignId = signal<string | null>(null);

  protected readonly maxBytesPerFile = MAX_ATTACHMENT_BYTES_PER_FILE;
  protected readonly maxAttachmentsPerCampaign = MAX_ATTACHMENTS_PER_CAMPAIGN;
  protected readonly maxMbPerFile = MAX_ATTACHMENT_BYTES_PER_FILE / (1024 * 1024);
  protected readonly maxMbTotal = MAX_TOTAL_ATTACHMENT_MB;

  protected subject = '';
  protected htmlBody = '';
  protected selectedClientTypeIds: string[] = [];
  protected includeInstitutionEmails = true;
  protected includeContactPersonEmails = false;

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

  protected clearError(): void {
    this.errorMessage.set(null);
  }

  protected clearUploadNotice(): void {
    this.uploadNotice.set(null);
  }

  protected createDraft(): void {
    this.errorMessage.set(null);
    this.uploadNotice.set(null);
    if (!this.subject.trim()) {
      this.errorMessage.set('Subject is required.');
      return;
    }
    if (this.selectedClientTypeIds.length === 0) {
      this.errorMessage.set('Select at least one client type.');
      return;
    }
    if (!this.includeInstitutionEmails && !this.includeContactPersonEmails) {
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
        includeContactPersonEmails: this.includeContactPersonEmails
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

  protected onAttachmentUpload(event: { files: File[] }): void {
    const id = this.campaignId();
    const files = event.files ?? [];
    if (!id || files.length === 0) {
      this.attachmentUpload?.clear();
      return;
    }

    this.errorMessage.set(null);
    this.uploadNotice.set(null);
    this.isBusy.set(true);
    this.adminApi
      .addMarketingCampaignAttachments(id, files)
      .pipe(
        catchError((err: unknown) => {
          this.errorMessage.set(
            err instanceof ApiError
              ? err.message
              : 'Upload failed. Check file types, sizes, and total attachment limits.'
          );
          return EMPTY;
        }),
        finalize(() => this.isBusy.set(false))
      )
      .subscribe(() => {
        this.attachmentUpload?.clear();
        this.uploadNotice.set('Attachments uploaded. They will be included when you send the campaign.');
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
        catchError((err: unknown) => {
          this.errorMessage.set(
            err instanceof ApiError ? err.message : 'Could not start campaign.'
          );
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
