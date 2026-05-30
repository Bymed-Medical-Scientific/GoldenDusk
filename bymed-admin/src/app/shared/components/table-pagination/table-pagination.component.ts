import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface TablePageChange {
  readonly pageNumber: number;
  readonly pageSize: number;
}

@Component({
  selector: 'app-table-pagination',
  standalone: true,
  imports: [FormsModule],
  host: {
    class: 'table-pagination-host'
  },
  template: `
    <div class="table-pagination">
      <p class="results-summary">
        @if (totalCount() === 0) {
          Showing 0 results
        } @else {
          Showing {{ rangeStart() }}-{{ rangeEnd() }} of {{ totalCount() }} results
        }
      </p>

      <div class="pagination-controls">
        <label class="rows-control">
          <span class="rows-label">Rows</span>
          <select
            [ngModel]="pageSize()"
            (ngModelChange)="onPageSizeChange($event)"
            aria-label="Rows per page"
          >
            @for (option of pageSizeOptions(); track option) {
              <option [ngValue]="option">{{ option }}</option>
            }
          </select>
        </label>

        <button
          type="button"
          class="nav-btn"
          (click)="goToPage(pageNumber() - 1)"
          [disabled]="!canGoPrevious()"
        >
          Previous
        </button>

        <div class="page-numbers" role="group" aria-label="Pagination">
          @for (page of visiblePages(); track page) {
            <button
              type="button"
              class="page-btn"
              [class.active]="page === pageNumber()"
              (click)="goToPage(page)"
              [attr.aria-current]="page === pageNumber() ? 'page' : null"
            >
              {{ page }}
            </button>
          }
        </div>

        <button
          type="button"
          class="nav-btn"
          (click)="goToPage(pageNumber() + 1)"
          [disabled]="!canGoNext()"
        >
          Next
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        border-top: 1px solid var(--surface-border);
      }

      .table-pagination {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem 1rem;
        padding: 0.875rem 1rem;
      }

      .results-summary {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--text-color-secondary);
      }

      .pagination-controls {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
      }

      .rows-control {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin-right: 0.25rem;
      }

      .rows-label {
        font-size: 0.8125rem;
        color: var(--text-color-secondary);
      }

      .rows-control select {
        height: 2rem;
        min-width: 4rem;
        padding: 0 1.75rem 0 0.625rem;
        border: 1px solid var(--surface-border);
        border-radius: var(--radius-sm);
        background: var(--surface-card);
        color: var(--text-color);
        font-size: 0.8125rem;
        font-family: inherit;
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.5rem center;
      }

      .nav-btn,
      .page-btn {
        height: 2rem;
        border: 1px solid var(--surface-border);
        border-radius: var(--radius-sm);
        background: var(--surface-card);
        color: var(--text-color);
        font-size: 0.8125rem;
        font-family: inherit;
        cursor: pointer;
        transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease;
      }

      .nav-btn {
        padding: 0 0.75rem;
      }

      .nav-btn:hover:not(:disabled) {
        background: var(--surface-hover);
      }

      .nav-btn:disabled {
        color: var(--text-color-muted);
        cursor: not-allowed;
      }

      .page-numbers {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
      }

      .page-btn {
        min-width: 2rem;
        padding: 0 0.375rem;
      }

      .page-btn:hover:not(.active) {
        background: var(--surface-hover);
      }

      .page-btn.active {
        background: var(--text-color);
        border-color: var(--text-color);
        color: var(--surface-card);
        font-weight: 600;
      }

      @media (max-width: 640px) {
        .table-pagination {
          flex-direction: column;
          align-items: stretch;
        }

        .pagination-controls {
          justify-content: space-between;
        }
      }
    `
  ]
})
export class TablePaginationComponent {
  readonly pageNumber = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalCount = input.required<number>();
  readonly pageSizeOptions = input<readonly number[]>([10, 25, 50]);

  readonly pageChange = output<TablePageChange>();

  protected readonly totalPages = computed(() => {
    const size = this.pageSize();
    if (size <= 0) {
      return 0;
    }
    return Math.ceil(this.totalCount() / size);
  });

  protected readonly rangeStart = computed(() => {
    if (this.totalCount() === 0) {
      return 0;
    }
    return (this.pageNumber() - 1) * this.pageSize() + 1;
  });

  protected readonly rangeEnd = computed(() =>
    Math.min(this.pageNumber() * this.pageSize(), this.totalCount())
  );

  protected readonly canGoPrevious = computed(() => this.pageNumber() > 1);
  protected readonly canGoNext = computed(() => this.pageNumber() < this.totalPages());

  protected readonly visiblePages = computed(() => {
    const total = this.totalPages();
    if (total <= 0) {
      return [] as number[];
    }

    const current = this.pageNumber();
    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    const pages: number[] = [];
    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }
    return pages;
  });

  protected goToPage(page: number): void {
    const total = this.totalPages();
    if (page < 1 || page > total || page === this.pageNumber()) {
      return;
    }

    this.pageChange.emit({
      pageNumber: page,
      pageSize: this.pageSize()
    });
  }

  protected onPageSizeChange(pageSize: number): void {
    const parsed = Number(pageSize);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed === this.pageSize()) {
      return;
    }

    this.pageChange.emit({
      pageNumber: 1,
      pageSize: parsed
    });
  }
}
