import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  catchError,
  concatMap,
  delay,
  EMPTY,
  finalize,
  forkJoin,
  from,
  map,
  Observable,
  of,
  reduce,
  switchMap,
  tap
} from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import {
  CategoryDto,
  CurrencyDefinitionDto,
  ProductDto,
  QuotationDetailDto,
  UpsertQuotationItemRequestDto
} from '@shared/models';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';

interface DraftQuotationLine {
  readonly localId: string;
  readonly itemId?: string;
  readonly productId: string;
  readonly productName: string;
  readonly productSku: string;
  readonly productImageUrl: string;
  quantity: number;
  supplierUnitCost: number;
  sourceCurrencyCode: string;
  exchangeRateToTarget: number;
  markupMultiplier: number;
  includeImage: boolean;
}

interface QuotationDraftForm {
  customerName: string;
  customerInstitution: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  subject: string;
  targetCurrencyCode: string;
  vatPercent: number;
  showVatOnDocument: boolean;
  notes: string;
  termsAndConditions: string;
}

@Component({
  selector: 'app-quotation-form-page',
  standalone: true,
  imports: [
    ButtonModule,
    CheckboxModule,
    CurrencyPipe,
    FormsModule,
    InputNumberModule,
    InputTextModule,
    RouterLink,
    SelectModule,
    TableModule,
    TextareaModule
  ],
  templateUrl: './quotation-form-page.component.html',
  styleUrl: './quotation-form-page.component.scss'
})
export class QuotationFormPageComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly quotationId = this.route.snapshot.paramMap.get('id');

  protected readonly isEditMode = this.quotationId !== null;
  protected readonly isInitializing = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pageMessage = signal<string | null>(null);
  protected readonly categories = signal<CategoryDto[]>([]);
  protected readonly currencies = signal<CurrencyDefinitionDto[]>([]);
  protected readonly products = signal<ProductDto[]>([]);
  protected readonly selectedCategoryId = signal<string>('all');
  protected readonly selectedClientType = signal<string>('all');
  protected readonly productSearch = signal('');
  protected readonly lines = signal<DraftQuotationLine[]>([]);
  protected readonly removedItemIds = signal<string[]>([]);
  protected readonly quotation = signal<QuotationDetailDto | null>(null);
  protected readonly statusLabel = computed(() => {
    const q = this.quotation();
    if (!q) return '';
    if (q.status === 0) return 'Draft';
    if (q.status === 1) return 'Finalized';
    if (q.status === 2) return 'Cancelled';
    return 'Unknown';
  });

  protected readonly form = signal<QuotationDraftForm>({
    customerName: '',
    customerInstitution: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    subject: '',
    targetCurrencyCode: 'USD',
    vatPercent: 15.5,
    showVatOnDocument: true,
    notes: '',
    termsAndConditions:
      'PAYMENT TERMS: COD\nDELIVERY: Ex-stock, subject to priority sale otherwise 5-7 working days\nVALIDITY: 60 days'
  });

  protected readonly productRows = computed(() => {
    const search = this.productSearch().trim().toLowerCase();
    const categoryId = this.selectedCategoryId();
    const clientType = this.selectedClientType();

    return this.products().filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search) ||
        (p.sku ?? '').toLowerCase().includes(search);
      const matchesCategory = categoryId === 'all' || p.categoryId === categoryId;
      const matchesClientType = clientType === 'all' || (p.clientType ?? 'general') === clientType;
      return matchesSearch && matchesCategory && matchesClientType;
    });
  });

  protected readonly lineSubtotal = computed(() =>
    this.lines().reduce((sum, line) => sum + this.computeLineExVat(line), 0)
  );
  protected readonly lineVat = computed(() =>
    this.lines().reduce((sum, line) => sum + this.computeLineVat(line), 0)
  );
  protected readonly lineTotal = computed(() =>
    this.lines().reduce((sum, line) => sum + this.computeLineIncVat(line), 0)
  );

  public ngOnInit(): void {
    forkJoin({
      categories: this.adminApi.getCategories(),
      currencies: this.adminApi.getCurrencies(),
      products: this.adminApi.getProducts(1, 500, {})
    })
      .pipe(
        switchMap(({ categories, currencies, products }) => {
          this.categories.set(categories);
          this.currencies.set(currencies);
          this.products.set(products.items);
          if (!this.isEditMode || !this.quotationId) {
            this.isInitializing.set(false);
            return of(null);
          }

          return this.adminApi.getQuotationById(this.quotationId).pipe(
            tap((quotation) => {
              this.hydrateDraftFromQuotation(quotation);
            })
          );
        }),
        catchError(() => {
          this.errorMessage.set('Could not load quotation builder.');
          return EMPTY;
        }),
        finalize(() => this.isInitializing.set(false))
      )
      .subscribe();
  }

  protected updateForm<K extends keyof QuotationDraftForm>(key: K, value: QuotationDraftForm[K]): void {
    this.form.update((current) => ({ ...current, [key]: value }));
  }

  protected addProduct(product: ProductDto): void {
    const targetCurrency = this.form().targetCurrencyCode;
    this.lines.update((lines) => [
      ...lines,
      {
        localId: crypto.randomUUID(),
        productId: product.id,
        productName: product.name,
        productSku: product.sku ?? '',
        productImageUrl: product.primaryImageUrl ?? '',
        quantity: 1,
        supplierUnitCost: product.price,
        sourceCurrencyCode: product.currency || targetCurrency,
        exchangeRateToTarget: 1,
        markupMultiplier: 2.0,
        includeImage: Boolean(product.primaryImageUrl)
      }
    ]);
  }

  protected removeLine(line: DraftQuotationLine): void {
    if (line.itemId) {
      this.removedItemIds.update((ids) => [...ids, line.itemId!]);
    }
    this.lines.update((lines) => lines.filter((x) => x.localId !== line.localId));
  }

  protected updateLine(localId: string, patch: Partial<DraftQuotationLine>): void {
    this.lines.update((lines) =>
      lines.map((line) => (line.localId === localId ? { ...line, ...patch } : line))
    );
  }

  protected updateLineNumber(
    localId: string,
    key: 'quantity' | 'supplierUnitCost' | 'exchangeRateToTarget' | 'markupMultiplier',
    rawValue: string,
    fallback: number
  ): void {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      this.updateLine(localId, { [key]: fallback } as Partial<DraftQuotationLine>);
      return;
    }

    if (key === 'quantity') {
      this.updateLine(localId, { quantity: Math.max(1, Math.round(parsed)) });
      return;
    }

    if (key === 'supplierUnitCost') {
      this.updateLine(localId, { supplierUnitCost: Math.max(0, parsed) });
      return;
    }

    if (key === 'exchangeRateToTarget') {
      this.updateLine(localId, { exchangeRateToTarget: Math.max(0.000001, parsed) });
      return;
    }

    this.updateLine(localId, { markupMultiplier: Math.max(0.01, parsed) });
  }

  protected saveDraft(): void {
    this.persist(false);
  }

  protected finalizeQuotation(): void {
    this.persist(true);
  }

  private persist(finalizeAfterSave: boolean): void {
    if (this.isSubmitting()) {
      return;
    }

    this.errorMessage.set(null);
    this.pageMessage.set(null);

    if (this.lines().length === 0) {
      this.pageMessage.set('Add at least one product line before saving.');
      return;
    }

    const form = this.form();
    if (!form.customerName.trim() || !form.customerInstitution.trim() || !form.subject.trim()) {
      this.pageMessage.set('Customer name, institution, and subject are required.');
      return;
    }

    this.isSubmitting.set(true);
    const payload = {
      customerName: form.customerName.trim(),
      customerInstitution: form.customerInstitution.trim(),
      customerEmail: form.customerEmail.trim(),
      customerPhone: form.customerPhone.trim(),
      customerAddress: form.customerAddress.trim(),
      subject: form.subject.trim(),
      targetCurrencyCode: form.targetCurrencyCode,
      vatPercent: form.vatPercent,
      showVatOnDocument: form.showVatOnDocument,
      notes: form.notes.trim() || null,
      termsAndConditions: form.termsAndConditions.trim() || null
    };

    const saveHeader$ =
      this.isEditMode && this.quotationId
        ? this.adminApi.updateQuotation(this.quotationId, payload)
        : this.adminApi.createQuotation(payload);

    saveHeader$
      .pipe(
        switchMap((saved) => {
          const quotationId = saved.id;
          return this.syncLines(quotationId).pipe(map(() => quotationId));
        }),
        switchMap((quotationId) =>
          finalizeAfterSave ? this.adminApi.finalizeQuotation(quotationId) : this.adminApi.getQuotationById(quotationId)
        ),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: (quotation) => {
          if (finalizeAfterSave) {
            this.router.navigate(['/quotations']);
            return;
          }

          this.hydrateDraftFromQuotation(quotation);
          this.removedItemIds.set([]);
          this.pageMessage.set('Draft saved.');
          if (!this.isEditMode) {
            void this.router.navigate(['/quotations', quotation.id, 'edit']);
          }
        },
        error: (error: unknown) => {
          const message =
            error instanceof ApiError ? error.message : 'Could not save quotation.';
          this.errorMessage.set(
            message.toLowerCase().includes('expected to affect 1 row')
              ? 'Draft save hit a temporary write conflict. Please save again once.'
              : message.toLowerCase().includes('unexpected')
                ? 'Draft save failed due to a temporary conflict. Please click Save draft again.'
              : message
          );
        }
      });
  }

  private syncLines(quotationId: string) {
    const currentQuotation = this.quotation();
    const existingItemsById = new Map(
      (currentQuotation?.items ?? []).map((item) => [item.id, item])
    );
    const operationsWithGaps: Array<(() => Observable<unknown>) | null> = [
      ...this.lines().map((line) => {
        if (line.itemId) {
          const existingItem = existingItemsById.get(line.itemId);
          if (!existingItem) {
            const request = this.mapLineToRequest(line);
            return () => this.adminApi.addQuotationItem(quotationId, request);
          }

          if (!this.hasLineChanged(line, existingItem)) {
            return null;
          }
        }

        const request = this.mapLineToRequest(line);
        return () =>
          line.itemId
            ? this.adminApi.updateQuotationItem(quotationId, line.itemId, request)
            : this.adminApi.addQuotationItem(quotationId, request);
      }),
      ...this.removedItemIds().map(
        (itemId) => () => this.adminApi.removeQuotationItem(quotationId, itemId)
      )
    ];

    const operations = operationsWithGaps.filter(
      (operation): operation is () => Observable<unknown> => operation !== null
    );

    if (operations.length === 0) {
      return of(null);
    }

    return from(operations).pipe(
      concatMap((runOperation) =>
        runOperation().pipe(
          catchError((error) => {
            // Retry once for transient optimistic concurrency collisions.
            return of(null).pipe(
              delay(120),
              switchMap(() => runOperation()),
              catchError(() => {
                throw error;
              })
            );
          })
        )
      ),
      reduce((_, __) => null, null)
    );
  }

  private hydrateDraftFromQuotation(quotation: QuotationDetailDto): void {
    this.quotation.set(quotation);
    this.form.set({
      customerName: quotation.customerName,
      customerInstitution: quotation.customerInstitution,
      customerEmail: quotation.customerEmail,
      customerPhone: quotation.customerPhone,
      customerAddress: quotation.customerAddress,
      subject: quotation.subject,
      targetCurrencyCode: quotation.targetCurrencyCode,
      vatPercent: quotation.vatPercent,
      showVatOnDocument: quotation.showVatOnDocument,
      notes: quotation.notes ?? '',
      termsAndConditions: quotation.termsAndConditions ?? ''
    });
    this.lines.set(
      quotation.items.map((item) => ({
        localId: crypto.randomUUID(),
        itemId: item.id,
        productId: item.productId,
        productName: item.productNameSnapshot,
        productSku: item.productSkuSnapshot,
        productImageUrl: item.productImageUrlSnapshot,
        quantity: item.quantity,
        supplierUnitCost: item.supplierUnitCost,
        sourceCurrencyCode: item.sourceCurrencyCode,
        exchangeRateToTarget: item.exchangeRateToTarget,
        markupMultiplier: item.markupMultiplier,
        includeImage: Boolean(item.productImageUrlSnapshot)
      }))
    );
  }

  private hasLineChanged(line: DraftQuotationLine, existingItem: QuotationDetailDto['items'][number]): boolean {
    const normalizedSku = line.productSku || null;
    const normalizedImage = line.includeImage ? line.productImageUrl || null : null;

    return (
      line.productId !== existingItem.productId ||
      line.productName !== existingItem.productNameSnapshot ||
      normalizedSku !== (existingItem.productSkuSnapshot || null) ||
      normalizedImage !== (existingItem.productImageUrlSnapshot || null) ||
      line.quantity !== existingItem.quantity ||
      line.supplierUnitCost !== existingItem.supplierUnitCost ||
      line.sourceCurrencyCode !== existingItem.sourceCurrencyCode ||
      line.exchangeRateToTarget !== existingItem.exchangeRateToTarget ||
      line.markupMultiplier !== existingItem.markupMultiplier
    );
  }

  private mapLineToRequest(line: DraftQuotationLine): UpsertQuotationItemRequestDto {
    return {
      productId: line.productId,
      productNameSnapshot: line.productName,
      productSkuSnapshot: line.productSku || null,
      productImageUrlSnapshot: line.includeImage ? line.productImageUrl || null : null,
      quantity: line.quantity,
      supplierUnitCost: line.supplierUnitCost,
      sourceCurrencyCode: line.sourceCurrencyCode,
      exchangeRateToTarget: line.exchangeRateToTarget,
      markupMultiplier: line.markupMultiplier
    };
  }

  protected computeUnitExVat(line: DraftQuotationLine): number {
    return line.supplierUnitCost * line.exchangeRateToTarget * line.markupMultiplier;
  }

  protected computeLineExVat(line: DraftQuotationLine): number {
    return this.computeUnitExVat(line) * line.quantity;
  }

  protected computeLineVat(line: DraftQuotationLine): number {
    return this.computeLineExVat(line) * (this.form().vatPercent / 100);
  }

  protected computeLineIncVat(line: DraftQuotationLine): number {
    return this.computeLineExVat(line) + this.computeLineVat(line);
  }
}
