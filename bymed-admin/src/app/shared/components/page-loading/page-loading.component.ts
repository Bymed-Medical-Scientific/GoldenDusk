import { Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-page-loading',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="loading-wrapper" [attr.aria-label]="label">
      <mat-spinner [diameter]="36"></mat-spinner>
      <span>{{ label }}</span>
    </div>
  `,
  styles: [
    `
      .loading-wrapper {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 0;
      }
    `
  ]
})
export class PageLoadingComponent {
  @Input() public label = 'Loading...';
}
