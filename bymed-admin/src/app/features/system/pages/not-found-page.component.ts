import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'app-not-found-page',
    imports: [RouterLink, MatButtonModule, MatCardModule],
    template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Page not found</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        The page you requested does not exist.
      </mat-card-content>
      <mat-card-actions>
        <a mat-button color="primary" routerLink="/dashboard">Back to dashboard</a>
      </mat-card-actions>
    </mat-card>
  `
})
export class NotFoundPageComponent {}
