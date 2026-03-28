import { HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  CategoryDto,
  BulkOperationResultDto,
  BulkDeleteProductsRequestDto,
  BulkSetProductAvailabilityRequestDto,
  CreateCategoryRequestDto,
  CreateProductRequestDto,
  AdjustInventoryRequestDto,
  ImportProductsResultDto,
  InventoryItemDto,
  InventoryLogEntryDto,
  OrderAnalyticsDto,
  OrderDetailDto,
  OrderSummaryDto,
  ContentImageUploadDto,
  ContentVersionDetailDto,
  ContentVersionSummaryDto,
  PageContentSummaryDto,
  UpdateOrderStatusRequestDto,
  CreatePageContentRequestDto,
  UpdatePageContentRequestDto,
  PagedResultDto,
  ProductDto,
  ProductImageDto,
  UpdateCategoryRequestDto,
  UpdateProductRequestDto,
  UserSummaryDto
} from '@shared/models';

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  public constructor(private readonly apiService: ApiService) {}

  /** Returns all categories (ordered by display order on the server). */
  public getCategories(): Observable<CategoryDto[]> {
    return this.apiService.get<CategoryDto[]>('categories');
  }

  public getCategoryById(categoryId: string): Observable<CategoryDto> {
    return this.apiService.get<CategoryDto>(`categories/${categoryId}`);
  }

  public createCategory(request: CreateCategoryRequestDto): Observable<CategoryDto> {
    return this.apiService.post<CreateCategoryRequestDto, CategoryDto>('categories', request);
  }

  public updateCategory(categoryId: string, request: UpdateCategoryRequestDto): Observable<CategoryDto> {
    return this.apiService.put<UpdateCategoryRequestDto, CategoryDto>(`categories/${categoryId}`, request);
  }

  public deleteCategory(categoryId: string): Observable<void> {
    return this.apiService.delete<void>(`categories/${categoryId}`);
  }

  public getProducts(
    pageNumber: number,
    pageSize: number,
    query?: {
      readonly categoryId?: string | null;
      readonly search?: string | null;
      readonly inStock?: boolean | null;
    }
  ): Observable<PagedResultDto<ProductDto>> {
    return this.apiService.get<PagedResultDto<ProductDto>>('products', {
      pageNumber,
      pageSize,
      categoryId: query?.categoryId,
      search: query?.search,
      inStock: query?.inStock
    });
  }

  public getProductById(productId: string): Observable<ProductDto> {
    return this.apiService.get<ProductDto>(`products/${productId}`);
  }

  public createProduct(request: CreateProductRequestDto): Observable<ProductDto> {
    return this.apiService.post<CreateProductRequestDto, ProductDto>('products', request);
  }

  public updateProduct(productId: string, request: UpdateProductRequestDto): Observable<ProductDto> {
    return this.apiService.put<UpdateProductRequestDto, ProductDto>(`products/${productId}`, request);
  }

  public uploadProductImage(productId: string, file: File, altText?: string): Observable<ProductImageDto> {
    const formData = new FormData();
    formData.append('file', file);
    if (altText !== undefined && altText.trim().length > 0) {
      formData.append('altText', altText.trim());
    }
    return this.apiService.postFormData<ProductImageDto>(`products/${productId}/images`, formData);
  }

  public uploadProductImageWithProgress(
    productId: string,
    file: File,
    altText?: string
  ): Observable<HttpEvent<ProductImageDto>> {
    const formData = new FormData();
    formData.append('file', file);
    if (altText !== undefined && altText.trim().length > 0) {
      formData.append('altText', altText.trim());
    }
    return this.apiService.postFormDataWithProgress<ProductImageDto>(`products/${productId}/images`, formData);
  }

  public deleteProduct(productId: string): Observable<void> {
    return this.apiService.delete<void>(`products/${productId}`);
  }

  public bulkDeleteProducts(request: BulkDeleteProductsRequestDto): Observable<BulkOperationResultDto> {
    return this.apiService.post<BulkDeleteProductsRequestDto, BulkOperationResultDto>('products/bulk-delete', request);
  }

  public bulkSetProductAvailability(
    request: BulkSetProductAvailabilityRequestDto
  ): Observable<BulkOperationResultDto> {
    return this.apiService.patch<BulkSetProductAvailabilityRequestDto, BulkOperationResultDto>(
      'products/bulk-availability',
      request
    );
  }

  public exportProducts(productIds?: string[]): Observable<Blob> {
    return this.apiService.getBlob('products/export', {
      ids: productIds && productIds.length > 0 ? productIds.join(',') : undefined
    });
  }

  public importProducts(file: File): Observable<ImportProductsResultDto> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiService.postFormData<ImportProductsResultDto>('products/import', formData);
  }

  public importProductsWithProgress(file: File): Observable<HttpEvent<ImportProductsResultDto>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiService.postFormDataWithProgress<ImportProductsResultDto>('products/import', formData);
  }

  public getOrders(
    pageNumber: number,
    pageSize: number,
    query?: {
      readonly status?: number | null;
      readonly dateFrom?: string | null;
      readonly dateTo?: string | null;
      readonly search?: string | null;
    }
  ): Observable<PagedResultDto<OrderSummaryDto>> {
    return this.apiService.get<PagedResultDto<OrderSummaryDto>>('orders', {
      pageNumber,
      pageSize,
      status: query?.status,
      dateFrom: query?.dateFrom,
      dateTo: query?.dateTo,
      search: query?.search
    });
  }

  public getOrderById(orderId: string): Observable<OrderDetailDto> {
    return this.apiService.get<OrderDetailDto>(`orders/${orderId}`);
  }

  public getOrderAnalytics(query?: {
    readonly dateFrom?: string | null;
    readonly dateTo?: string | null;
  }): Observable<OrderAnalyticsDto> {
    return this.apiService.get<OrderAnalyticsDto>('orders/analytics', {
      dateFrom: query?.dateFrom,
      dateTo: query?.dateTo
    });
  }

  public updateOrderStatus(
    orderId: string,
    request: UpdateOrderStatusRequestDto
  ): Observable<OrderDetailDto> {
    return this.apiService.put<UpdateOrderStatusRequestDto, OrderDetailDto>(
      `orders/${orderId}/status`,
      request
    );
  }

  /** CSV export; uses the same filters as the order list (admin). */
  public exportOrders(query?: {
    readonly status?: number | null;
    readonly dateFrom?: string | null;
    readonly dateTo?: string | null;
    readonly search?: string | null;
  }): Observable<Blob> {
    return this.apiService.getBlob('orders/export', {
      status: query?.status,
      dateFrom: query?.dateFrom,
      dateTo: query?.dateTo,
      search: query?.search
    });
  }

  /** Paged inventory grid (admin). */
  public getInventory(
    pageNumber: number,
    pageSize: number,
    query?: { readonly lowStockOnly?: boolean; readonly search?: string | null }
  ): Observable<PagedResultDto<InventoryItemDto>> {
    return this.apiService.get<PagedResultDto<InventoryItemDto>>('inventory', {
      pageNumber,
      pageSize,
      lowStockOnly: query?.lowStockOnly === true ? true : undefined,
      search: query?.search?.trim() ? query.search.trim() : undefined
    });
  }

  /** All products at or below low-stock threshold (admin). */
  public getLowStockInventory(): Observable<InventoryItemDto[]> {
    return this.apiService.get<InventoryItemDto[]>('inventory/low-stock');
  }

  public adjustInventory(
    productId: string,
    request: AdjustInventoryRequestDto
  ): Observable<InventoryItemDto> {
    return this.apiService.postWithQuery<AdjustInventoryRequestDto, InventoryItemDto>(
      'inventory/adjust',
      request,
      { productId }
    );
  }

  public getInventoryHistory(
    productId: string,
    pageNumber: number,
    pageSize: number,
    query?: { readonly dateFrom?: string | null; readonly dateTo?: string | null }
  ): Observable<PagedResultDto<InventoryLogEntryDto>> {
    return this.apiService.get<PagedResultDto<InventoryLogEntryDto>>(
      `inventory/history/${productId}`,
      {
        pageNumber,
        pageSize,
        dateFrom: query?.dateFrom?.trim() ? query.dateFrom.trim() : undefined,
        dateTo: query?.dateTo?.trim() ? query.dateTo.trim() : undefined
      }
    );
  }

  public getUsers(pageNumber: number, pageSize: number): Observable<PagedResultDto<UserSummaryDto>> {
    return this.apiService.get<PagedResultDto<UserSummaryDto>>('users', { pageNumber, pageSize });
  }

  /** CMS pages including drafts (admin). */
  public getContentPages(pageNumber: number, pageSize: number): Observable<PagedResultDto<PageContentSummaryDto>> {
    return this.apiService.get<PagedResultDto<PageContentSummaryDto>>('content/manage', {
      pageNumber,
      pageSize
    });
  }

  public getPageContentBySlug(slug: string): Observable<PageContentSummaryDto> {
    const enc = encodeURIComponent(slug);
    return this.apiService.get<PageContentSummaryDto>(`content/${enc}/manage`);
  }

  public createPageContent(request: CreatePageContentRequestDto): Observable<PageContentSummaryDto> {
    return this.apiService.post<CreatePageContentRequestDto, PageContentSummaryDto>('content', request);
  }

  public deletePageContent(slug: string): Observable<void> {
    const enc = encodeURIComponent(slug);
    return this.apiService.delete<void>(`content/${enc}`);
  }

  public updatePageContent(
    slug: string,
    request: UpdatePageContentRequestDto
  ): Observable<PageContentSummaryDto> {
    return this.apiService.put<UpdatePageContentRequestDto, PageContentSummaryDto>(
      `content/${encodeURIComponent(slug)}`,
      request
    );
  }

  public uploadContentImage(file: File): Observable<ContentImageUploadDto> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiService.postFormData<ContentImageUploadDto>('content/images', formData);
  }

  public uploadContentImageWithProgress(file: File): Observable<HttpEvent<ContentImageUploadDto>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiService.postFormDataWithProgress<ContentImageUploadDto>('content/images', formData);
  }

  public getContentVersionHistory(
    slug: string,
    pageNumber: number,
    pageSize: number
  ): Observable<PagedResultDto<ContentVersionSummaryDto>> {
    const enc = encodeURIComponent(slug);
    return this.apiService.get<PagedResultDto<ContentVersionSummaryDto>>(`content/${enc}/versions`, {
      pageNumber,
      pageSize
    });
  }

  public getContentVersionDetail(slug: string, versionId: string): Observable<ContentVersionDetailDto> {
    const enc = encodeURIComponent(slug);
    return this.apiService.get<ContentVersionDetailDto>(`content/${enc}/versions/${versionId}`);
  }

  public revertContentToVersion(slug: string, versionId: string): Observable<PageContentSummaryDto> {
    const enc = encodeURIComponent(slug);
    return this.apiService.post<Record<string, never>, PageContentSummaryDto>(
      `content/${enc}/versions/${versionId}/revert`,
      {}
    );
  }
}
