import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { CurrencyDefinitionDto } from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-quotation-currencies-page',
  standalone: true,
  imports: [
    ButtonModule,
    CheckboxModule,
    FormsModule,
    InputNumberModule,
    InputTextModule,
    RouterLink,
    TableModule
  ],
  templateUrl: './quotation-currencies-page.component.html',
  styleUrl: './quotation-currencies-page.component.scss'
})
export class QuotationCurrenciesPageComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly rows = signal<CurrencyDefinitionDto[]>([]);
  protected readonly form = signal({
    code: '',
    name: '',
    symbol: '',
    decimalPlaces: 2,
    isActive: true
  });

  public ngOnInit(): void {
    this.load();
  }

  protected updateForm<K extends keyof ReturnType<typeof this.form>>(key: K, value: ReturnType<typeof this.form>[K]): void {
    this.form.update((current) => ({ ...current, [key]: value }));
  }

  protected create(): void {
    const form = this.form();
    if (!form.code.trim() || !form.name.trim()) {
      this.errorMessage.set('Currency code and name are required.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.adminApi
      .createCurrency({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        symbol: form.symbol.trim() || null,
        decimalPlaces: form.decimalPlaces,
        isActive: form.isActive
      })
      .pipe(
        catchError((error: unknown) => {
          this.errorMessage.set(error instanceof ApiError ? error.message : 'Could not create currency.');
          return EMPTY;
        }),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe(() => {
        this.form.set({ code: '', name: '', symbol: '', decimalPlaces: 2, isActive: true });
        this.load();
      });
  }

  protected edit(row: CurrencyDefinitionDto): void {
    const name = window.prompt('Currency name', row.name);
    if (name === null) return;
    const symbol = window.prompt('Currency symbol', row.symbol ?? '');
    if (symbol === null) return;
    const decimalRaw = window.prompt('Decimal places', String(row.decimalPlaces));
    if (decimalRaw === null) return;
    const parsed = Number.parseInt(decimalRaw, 10);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 6) {
      this.errorMessage.set('Decimal places must be between 0 and 6.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.adminApi
      .updateCurrency(row.id, {
        name: name.trim(),
        symbol: symbol.trim() || null,
        decimalPlaces: parsed,
        isActive: row.isActive
      })
      .pipe(
        catchError((error: unknown) => {
          this.errorMessage.set(error instanceof ApiError ? error.message : 'Could not update currency.');
          return EMPTY;
        }),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe(() => this.load());
  }

  protected toggleActive(row: CurrencyDefinitionDto): void {
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.adminApi
      .updateCurrency(row.id, {
        name: row.name,
        symbol: row.symbol || null,
        decimalPlaces: row.decimalPlaces,
        isActive: !row.isActive
      })
      .pipe(
        catchError((error: unknown) => {
          this.errorMessage.set(error instanceof ApiError ? error.message : 'Could not update currency status.');
          return EMPTY;
        }),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe(() => this.load());
  }

  protected remove(row: CurrencyDefinitionDto): void {
    if (!window.confirm(`Delete ${row.code}?`)) return;
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.adminApi
      .deleteCurrency(row.id)
      .pipe(
        catchError((error: unknown) => {
          this.errorMessage.set(error instanceof ApiError ? error.message : 'Could not delete currency.');
          return EMPTY;
        }),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe(() => this.load());
  }

  private load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.adminApi
      .getCurrencies()
      .pipe(
        catchError(() => {
          this.errorMessage.set('Could not load currencies.');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((rows) => this.rows.set(rows));
  }
}
