import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-skeleton',
  standalone: true,
  template: `
    <div class="skel-page" role="status" aria-label="Loading dashboard">
      <div class="skel-header">
        <div class="skel-line skel-line--title"></div>
        <div class="skel-line skel-line--subtitle"></div>
      </div>

      <div class="skel-kpi-grid">
        @for (card of kpiCards; track card) {
          <div class="skel-kpi">
            <div class="skel-line skel-line--label"></div>
            <div class="skel-line skel-line--value"></div>
            <div class="skel-line skel-line--hint"></div>
            <div class="skel-sparkline"></div>
          </div>
        }
      </div>

      <div class="skel-charts">
        <div class="skel-chart-large"></div>
        <div class="skel-chart-small"></div>
      </div>
    </div>
  `,
  styles: [
    `
      .skel-page {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .skel-header {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .skel-kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
      }

      .skel-kpi,
      .skel-chart-large,
      .skel-chart-small {
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        border-radius: var(--radius-lg);
        padding: 1.25rem;
      }

      .skel-kpi {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
      }

      .skel-charts {
        display: grid;
        grid-template-columns: 1.6fr 1fr;
        gap: 1rem;
      }

      .skel-chart-large {
        min-height: 18rem;
      }

      .skel-chart-small {
        min-height: 18rem;
      }

      .skel-line,
      .skel-sparkline {
        border-radius: 6px;
        background: linear-gradient(90deg, var(--surface-hover) 0%, var(--surface-border) 40%, var(--surface-hover) 80%);
        background-size: 200% 100%;
        animation: dash-skel 1.2s ease-in-out infinite;
      }

      .skel-line--title {
        height: 1.75rem;
        width: 40%;
      }

      .skel-line--subtitle {
        height: 0.9375rem;
        width: 60%;
      }

      .skel-line--label {
        height: 0.8125rem;
        width: 50%;
      }

      .skel-line--value {
        height: 1.625rem;
        width: 65%;
      }

      .skel-line--hint {
        height: 0.75rem;
        width: 45%;
      }

      .skel-sparkline {
        height: 2rem;
        margin-top: 0.25rem;
      }

      @keyframes dash-skel {
        0% {
          background-position: 100% 0;
        }
        100% {
          background-position: -100% 0;
        }
      }

      @media (max-width: 768px) {
        .skel-charts {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class DashboardSkeletonComponent {
  protected readonly kpiCards = [0, 1, 2, 3];
}
