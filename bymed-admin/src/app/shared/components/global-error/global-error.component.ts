import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-global-error',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <mat-card class="error-card">
      <mat-card-header>
        <mat-card-title>Something went wrong</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        {{ message }}
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .error-card {
        border-left: 4px solid #b00020;
      }
    `
  ]
})
export class GlobalErrorComponent {
  @Input() public message = 'An unexpected error occurred. Please try again.';
}
