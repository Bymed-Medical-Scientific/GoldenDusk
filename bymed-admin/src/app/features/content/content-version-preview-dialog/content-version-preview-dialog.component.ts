import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ContentVersionDetailDto } from '@shared/models';

export interface ContentVersionPreviewDialogData {
  readonly slug: string;
  readonly versionId: string;
}

@Component({
  selector: 'app-content-version-preview-dialog',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatDialogModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>Version preview</h2>
    <mat-dialog-content class="dialog-scroll">
      @if (isLoading()) {
        <div class="centered">
          <mat-spinner diameter="36" />
        </div>
      } @else if (errorMessage()) {
        <p class="error-text">{{ errorMessage() }}</p>
      } @else if (detail()) {
        <p class="meta">
          <strong>{{ detail()!.createdBy }}</strong>
          ·
          {{ detail()!.createdAt | date: 'medium' }}
        </p>
        <div class="preview-html" [innerHTML]="trustedHtml()"></div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button type="button" mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-scroll {
        min-width: min(560px, 92vw);
        max-width: 720px;
        max-height: min(70vh, 640px);
        overflow: auto;
      }
      .centered {
        display: flex;
        justify-content: center;
        padding: 2rem;
      }
      .meta {
        margin: 0 0 1rem;
        font-size: 0.875rem;
        color: rgba(0, 0, 0, 0.65);
      }
      .preview-html {
        line-height: 1.5;
      }
      .preview-html img {
        max-width: 100%;
        height: auto;
      }
      .error-text {
        color: #c62828;
      }
    `
  ]
})
export class ContentVersionPreviewDialogComponent implements OnInit {
  private readonly data = inject<ContentVersionPreviewDialogData>(MAT_DIALOG_DATA);
  private readonly adminApi = inject(AdminApiService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly detail = signal<ContentVersionDetailDto | null>(null);

  public ngOnInit(): void {
    this.adminApi
      .getContentVersionDetail(this.data.slug, this.data.versionId)
      .pipe(
        catchError(() => {
          this.errorMessage.set('Could not load this version.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((d) => this.detail.set(d));
  }

  protected trustedHtml(): SafeHtml {
    const html = this.detail()?.content ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
