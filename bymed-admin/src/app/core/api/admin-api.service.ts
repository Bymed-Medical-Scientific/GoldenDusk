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

  public createCategory(request: CreateCategoryRequestDto): Observable<CategoryDto> {
    return this.apiService.post<CreateCategoryRequestDto, CategoryDto>('categories', request);
  }

  public updateCategory(categoryId: string, request: UpdateCategoryRequestDto): Observable<CategoryDto> {
    return this.apiService.put<UpdateCategoryRequestDto, CategoryDto>(`categories/${categoryId}`, request);
  }

  public deleteCategory(categoryId: string): Observable<void> {
    return this.apiService.delete<void>(`categories/${categoryId}`);
  }

  public getProducts(page: number, pageSize: number): Observable<PagedResultDto<ProductDto>> {
    return this.apiService.get<PagedResultDto<ProductDto>>('products', { page, pageSize });
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

  public getOrders(page: number, pageSize: number): Observable<PagedResultDto<OrderSummaryDto>> {
    return this.apiService.get<PagedResultDto<OrderSummaryDto>>('orders', { page, pageSize });
  }

  public getOrderById(orderId: string): Observable<OrderDetailDto> {
    return this.apiService.get<OrderDetailDto>(`orders/${orderId}`);
  }

  public getInventory(): Observable<InventoryItemDto[]> {
    return this.apiService.get<InventoryItemDto[]>('inventory');
  }

  public getUsers(page: number, pageSize: number): Observable<PagedResultDto<UserSummaryDto>> {
    return this.apiService.get<PagedResultDto<UserSummaryDto>>('users', { page, pageSize });
  }
}
