import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-dashboard-skeleton',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <div class="skel-grid" role="status" aria-label="Loading dashboard">
      @for (card of cards; track card) {
        <mat-card class="skel-card">
          <mat-card-header>
            <div class="skel-title"></div>
          </mat-card-header>
          <mat-card-content>
            <div class="skel-line skel-line--wide"></div>
            <div class="skel-line"></div>
            <div class="skel-line skel-line--short"></div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [
    `
      .skel-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
      }

      .skel-card {
        min-height: 140px;
      }

      .skel-title {
        height: 1.1rem;
        width: 55%;
        border-radius: 4px;
        background: linear-gradient(90deg, #e8eaf0 0%, #f4f5f8 40%, #e8eaf0 80%);
        background-size: 200% 100%;
        animation: dash-skel 1.2s ease-in-out infinite;
      }

      .skel-line {
        height: 0.75rem;
        margin-top: 0.65rem;
        border-radius: 4px;
        width: 80%;
        background: linear-gradient(90deg, #e8eaf0 0%, #f4f5f8 40%, #e8eaf0 80%);
        background-size: 200% 100%;
        animation: dash-skel 1.2s ease-in-out infinite;
      }

      .skel-line--wide {
        width: 95%;
      }

      .skel-line--short {
        width: 45%;
      }

      @keyframes dash-skel {
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
export class DashboardSkeletonComponent {
  protected readonly cards = [0, 1, 2, 3];
}
