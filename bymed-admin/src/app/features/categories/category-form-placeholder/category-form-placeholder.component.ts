import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

/** Temporary route target until the category form (task 31.2) is implemented. */
@Component({
  selector: 'app-category-form-placeholder',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <mat-card class="placeholder-card">
      <mat-card-header>
        <mat-card-title>Category form</mat-card-title>
        <mat-card-subtitle>Create and edit flows will be added in the next task.</mat-card-subtitle>
      </mat-card-header>
      <mat-card-actions align="start">
        <a mat-stroked-button routerLink="/categories">
          <mat-icon>arrow_back</mat-icon>
          Back to categories
        </a>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [
    `
      .placeholder-card {
        max-width: 520px;
        margin: 1rem auto;
      }
    `
  ]
})
export class CategoryFormPlaceholderComponent {}
