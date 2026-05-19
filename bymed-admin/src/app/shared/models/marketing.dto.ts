export type MarketingCampaignStatus =
  | 'Draft'
  | 'Queued'
  | 'Sending'
  | 'Completed'
  | 'Failed';

export type MarketingRecipientEmailSource = 'InstitutionEmail' | 'ContactPersonEmail';

export interface MarketingCampaignAttachmentDto {
  readonly id: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly sizeBytes: number;
}

export interface MarketingCampaignDetailDto {
  readonly id: string;
  readonly status: MarketingCampaignStatus;
  readonly subject: string;
  readonly htmlBody: string | null;
  readonly clientTypeIds: readonly string[];
  readonly includeInstitutionEmails: boolean;
  readonly includeContactPersonEmails: boolean;
  readonly createdAtUtc: string;
  readonly attachments: readonly MarketingCampaignAttachmentDto[];
}

export interface MarketingCampaignRecipientPreviewRowDto {
  readonly institutionName: string;
  readonly email: string;
  readonly source: MarketingRecipientEmailSource;
}

export interface MarketingCampaignPreviewDto {
  readonly matchingClientCount: number;
  readonly recipientCount: number;
  readonly sampleRecipients: readonly MarketingCampaignRecipientPreviewRowDto[];
}

export interface MarketingCampaignStatusDto {
  readonly id: string;
  readonly status: MarketingCampaignStatus;
  readonly subject: string;
  readonly totalRecipients: number;
  readonly sentCount: number;
  readonly failedCount: number;
  readonly pendingCount: number;
  readonly lastError: string | null;
  readonly createdAtUtc: string;
  readonly startedAtUtc: string | null;
  readonly completedAtUtc: string | null;
}

export interface MarketingCampaignListItemDto {
  readonly id: string;
  readonly status: MarketingCampaignStatus;
  readonly subject: string;
  readonly createdAtUtc: string;
}

export interface CreateMarketingCampaignRequestDto {
  readonly subject: string;
  readonly htmlBody?: string | null;
  readonly clientTypeIds: readonly string[];
  readonly includeInstitutionEmails: boolean;
  readonly includeContactPersonEmails: boolean;
}
