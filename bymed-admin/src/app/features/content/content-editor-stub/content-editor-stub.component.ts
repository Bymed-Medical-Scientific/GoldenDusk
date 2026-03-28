import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

/** Placeholder route target until the full content editor ships. */
@Component({
  selector: 'app-content-editor-stub',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  template: `
    <mat-card class="stub-card">
      <mat-card-header>
        <mat-card-title>Edit “{{ slug }}”</mat-card-title>
        <mat-card-subtitle>Rich text editor and publishing controls will be added here.</mat-card-subtitle>
      </mat-card-header>
      <mat-card-actions>
        <a mat-stroked-button routerLink="/content">
          <mat-icon>arrow_back</mat-icon>
          Back to pages
        </a>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [
    `
      .stub-card {
        max-width: 40rem;
        margin: 1rem auto;
      }
      mat-card-actions {
        padding: 0 1rem 1rem;
      }
    `
  ]
})
export class ContentEditorStubComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  protected slug = '';

  public ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
  }
}
