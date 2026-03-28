import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  template: `
    <div class="skel" role="status" [attr.aria-label]="ariaLabel">
      <div class="skel-header">
        @for (c of columnIndices; track c) {
          <div class="skel-cell skel-cell--header" [style.flex]="flexWeight(c)"></div>
        }
      </div>
      @for (r of rowIndices; track r) {
        <div class="skel-row">
          @for (c of columnIndices; track c) {
            <div class="skel-cell" [style.flex]="flexWeight(c)"></div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .skel {
        padding: 0 0 0.5rem;
      }

      .skel-header,
      .skel-row {
        display: flex;
        align-items: stretch;
        gap: 0.75rem;
        padding: 0.65rem 1rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      }

      .skel-header {
        background: rgba(0, 0, 0, 0.02);
      }

      .skel-cell {
        min-height: 1.1rem;
        border-radius: 4px;
        background: linear-gradient(90deg, #e8eaf0 0%, #f4f5f8 40%, #e8eaf0 80%);
        background-size: 200% 100%;
        animation: skel-shimmer 1.2s ease-in-out infinite;
      }

      .skel-cell--header {
        min-height: 0.85rem;
        opacity: 0.85;
      }

      @keyframes skel-shimmer {
        0% {
          background-position: 100% 0;
        }
        100% {
          background-position: -100% 0;
        }
      }
    `
  ]
})
export class TableSkeletonComponent {
  @Input({ required: true }) public columnCount!: number;
  @Input() public rowCount = 8;
  @Input() public ariaLabel = 'Loading table';

  private readonly flexCycle = [1.4, 0.9, 1.1, 1, 0.75, 1.2, 0.85];

  protected get columnIndices(): number[] {
    const n = Math.max(1, this.columnCount);
    return Array.from({ length: n }, (_, i) => i);
  }

  protected get rowIndices(): number[] {
    const n = Math.max(1, this.rowCount);
    return Array.from({ length: n }, (_, i) => i);
  }

  protected flexWeight(index: number): string {
    return String(this.flexCycle[index % this.flexCycle.length]);
  }
}
