import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

/** Temporary route target until the product form (task 32.2) is implemented. */
@Component({
  selector: 'app-product-form-placeholder',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <mat-card class="placeholder-card">
      <mat-card-header>
        <mat-card-title>Product form</mat-card-title>
        <mat-card-subtitle>Create and edit flows will be added in task 32.2.</mat-card-subtitle>
      </mat-card-header>
      <mat-card-actions align="start">
        <a mat-stroked-button routerLink="/products">
          <mat-icon>arrow_back</mat-icon>
          Back to products
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
export class ProductFormPlaceholderComponent {}
