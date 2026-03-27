import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { AdminApiService } from '@core/api/admin-api.service';
import { ApiError } from '@core/api/api-error';
import { OrderDetailDto } from '@shared/models';
import { OrderDetailComponent } from './order-detail.component';

describe('OrderDetailComponent', () => {
  const orderId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  const shipping = {
    name: 'Alice',
    addressLine1: '1 Main St',
    city: 'City',
    state: 'ST',
    postalCode: '12345',
    country: 'US',
    phone: '555'
  };

  const pendingOrder: OrderDetailDto = {
    id: orderId,
    orderNumber: 'BYM-2001',
    status: 0,
    customerEmail: 'c@example.com',
    customerName: 'Customer',
    shippingAddress: shipping,
    subtotal: 50,
    tax: 0,
    shippingCost: 0,
    total: 50,
    currency: 'USD',
    exchangeRate: 1,
    paymentStatus: 1,
    paymentReference: 'p',
    paymentMethod: 'card',
    items: [
      {
        id: 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii',
        productId: 'pppppppp-pppp-pppp-pppp-pppppppppppp',
        productName: 'Widget',
        productImageUrl: '',
        quantity: 1,
        pricePerUnit: 50,
        subtotal: 50
      }
    ],
    creationTime: '2024-06-01T12:00:00.000Z',
    notes: ''
  };

  const processingOrder: OrderDetailDto = {
    ...pendingOrder,
    status: 1
  };

  describe('with order id', () => {
    let fixture: ComponentFixture<OrderDetailComponent>;
    let component: OrderDetailComponent;
    let adminApiSpy: jasmine.SpyObj<AdminApiService>;
    let openDialogSpy: jasmine.Spy;
    let snackBarOpenSpy: jasmine.Spy;

    beforeEach(async () => {
      adminApiSpy = jasmine.createSpyObj<AdminApiService>('AdminApiService', ['getOrderById', 'updateOrderStatus']);
      adminApiSpy.getOrderById.and.returnValue(of(pendingOrder));
      adminApiSpy.updateOrderStatus.and.returnValue(of(processingOrder));

      await TestBed.configureTestingModule({
        imports: [OrderDetailComponent, NoopAnimationsModule],
        providers: [
          { provide: AdminApiService, useValue: adminApiSpy },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { paramMap: convertToParamMap({ id: orderId }) } }
          }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(OrderDetailComponent);
      component = fixture.componentInstance;
      const dialog = TestBed.inject(MatDialog);
      const snackBar = TestBed.inject(MatSnackBar);
      openDialogSpy = spyOn(dialog, 'open').and.returnValue({
        afterClosed: () => of(true)
      } as never);
      snackBarOpenSpy = spyOn(snackBar, 'open');
      (component as any).dialog = dialog;
      (component as any).snackBar = snackBar;
      fixture.detectChanges();
    });

    it('loads order by route id and shows order number', () => {
      expect(adminApiSpy.getOrderById).toHaveBeenCalledWith(orderId);
      expect((component as any).order()?.orderNumber).toBe('BYM-2001');
      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('BYM-2001');
    });

    it('requires tracking when moving to Shipped and blocks apply', () => {
      (component as any).onNextStatusPick(2);
      expect((component as any).requiresTrackingForShippedSelection()).toBeTrue();
      expect((component as any).canApplyStatus()).toBeFalse();

      (component as any).trackingDraft.set('TRACK-123');
      expect((component as any).canApplyStatus()).toBeTrue();
    });

    it('updates status after confirmation', () => {
      (component as any).onNextStatusPick(1);
      (component as any).promptApplyStatus(pendingOrder);

      expect(openDialogSpy).toHaveBeenCalled();
      expect(adminApiSpy.updateOrderStatus).toHaveBeenCalledWith(orderId, { status: 1 });
      expect((component as any).order()?.status).toBe(1);
      expect(snackBarOpenSpy).toHaveBeenCalledWith('Order status updated.', 'Dismiss', { duration: 4000 });
    });

    it('sends tracking number when marking shipped', () => {
      openDialogSpy.and.returnValue({
        afterClosed: () => of(true)
      } as never);

      (component as any).onNextStatusPick(2);
      (component as any).trackingDraft.set('TN-99');
      (component as any).promptApplyStatus(processingOrder);

      expect(adminApiSpy.updateOrderStatus).toHaveBeenCalledWith(orderId, {
        status: 2,
        trackingNumber: 'TN-99'
      });
    });

    it('shows snackbar when status update fails', () => {
      adminApiSpy.updateOrderStatus.and.returnValue(
        throwError(() => new ApiError(400, 'Invalid transition.'))
      );

      (component as any).onNextStatusPick(1);
      (component as any).promptApplyStatus(pendingOrder);

      expect(snackBarOpenSpy).toHaveBeenCalledWith('Invalid transition.', 'Dismiss', { duration: 8000 });
    });
  });

  describe('without order id', () => {
    it('sets not found when id param is missing', async () => {
      const adminApiSpy = jasmine.createSpyObj<AdminApiService>('AdminApiService', ['getOrderById', 'updateOrderStatus']);

      await TestBed.configureTestingModule({
        imports: [OrderDetailComponent, NoopAnimationsModule],
        providers: [
          { provide: AdminApiService, useValue: adminApiSpy },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { paramMap: convertToParamMap({}) } }
          }
        ]
      }).compileComponents();

      const f = TestBed.createComponent(OrderDetailComponent);
      f.detectChanges();

      expect((f.componentInstance as any).notFoundMessage()).toBe('Order not found.');
      expect(adminApiSpy.getOrderById).not.toHaveBeenCalled();
    });
  });
});
