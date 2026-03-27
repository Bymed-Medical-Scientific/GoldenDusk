import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  CategoryDto,
  CreateCategoryRequestDto,
  CreateProductRequestDto,
  InventoryItemDto,
  OrderDetailDto,
  OrderSummaryDto,
  PagedResultDto,
  ProductDto,
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

  public createProduct(request: CreateProductRequestDto): Observable<ProductDto> {
    return this.apiService.post<CreateProductRequestDto, ProductDto>('products', request);
  }

  public updateProduct(productId: string, request: UpdateProductRequestDto): Observable<ProductDto> {
    return this.apiService.put<UpdateProductRequestDto, ProductDto>(`products/${productId}`, request);
  }

  public deleteProduct(productId: string): Observable<void> {
    return this.apiService.delete<void>(`products/${productId}`);
  }

  public getOrders(pageNumber: number, pageSize: number): Observable<PagedResultDto<OrderSummaryDto>> {
    return this.apiService.get<PagedResultDto<OrderSummaryDto>>('orders', { pageNumber, pageSize });
  }

  public getOrderById(orderId: string): Observable<OrderDetailDto> {
    return this.apiService.get<OrderDetailDto>(`orders/${orderId}`);
  }

  public getInventory(): Observable<InventoryItemDto[]> {
    return this.apiService.get<InventoryItemDto[]>('inventory');
  }

  public getUsers(pageNumber: number, pageSize: number): Observable<PagedResultDto<UserSummaryDto>> {
    return this.apiService.get<PagedResultDto<UserSummaryDto>>('users', { pageNumber, pageSize });
  }
}
