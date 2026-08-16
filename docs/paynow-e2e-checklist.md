# PayNow checkout — manual E2E checklist

Use this checklist when validating PayNow integration in sandbox or production.

## Prerequisites

- [ ] `PAYNOW_INTEGRATION_ID` and `PAYNOW_INTEGRATION_KEY` set in repo root `.env` (maps to `PayNow__*` on the API)
- [ ] `PayNow:InitiateTransactionUrl` = `https://www.paynow.co.zw/interface/initiatetransaction`
- [ ] `PayNow:StorefrontBaseUrl` matches the storefront origin (e.g. `http://localhost:3000` or production site URL)
- [ ] `PayNow:ResultUrl` is a **public HTTPS** URL pointing to `/api/v1/Payments/webhook`
- [ ] PayNow merchant dashboard **Result URL** matches `PayNow:ResultUrl`
- [ ] API CORS allows the storefront origin with credentials

For local webhook testing, expose the API via ngrok (or similar) and set `ResultUrl` to `{tunnel}/api/v1/Payments/webhook`.

## Happy path

1. [ ] Add products to cart → proceed to checkout
2. [ ] Complete shipping, contact, and review steps
3. [ ] Click **Place order and pay** → browser redirects to PayNow hosted page
4. [ ] Complete payment on PayNow
5. [ ] Browser returns to `/checkout?orderId={guid}&payment=returned`
6. [ ] Checkout page shows confirming state, then redirects to `/checkout/confirmation?orderId={guid}`
7. [ ] Confirmation page shows success (payment status completed)
8. [ ] Cart is empty after successful payment
9. [ ] Order confirmation email received **after** payment (not at order creation)
10. [ ] Admin/order history shows order status **Processing**, payment **Completed**

## Webhook-only path

1. [ ] Create order and start PayNow payment
2. [ ] Close browser tab before returning to storefront
3. [ ] Verify PayNow webhook updates order to paid in database/admin
4. [ ] Open `/checkout/confirmation?orderId={guid}` — success UI when payment completed

## Retry and abandonment

1. [ ] Start checkout, create order, redirect to PayNow, then abandon payment
2. [ ] Cart still contains items (not cleared until payment succeeds)
3. [ ] Account order detail or checkout shows **Complete payment** / **Retry payment**
4. [ ] Retry initiates PayNow again without creating a duplicate order (same idempotency key)

## Idempotency

1. [ ] Double-click **Place order and pay** quickly (or retry after network blip)
2. [ ] Only one order exists for the same cart + idempotency key
3. [ ] Re-initiating payment for a pending order reuses the same PayNow session when still pending

## Security checks

1. [ ] Webhook with invalid hash returns 400
2. [ ] Webhook with wrong amount does **not** mark order as paid
3. [ ] Confirmation page shows pending/failed states for unpaid orders (not fake success)

## Reference

- [PayNow C# quickstart](https://developers.paynow.co.zw/docs/paynow/csharp_quickstart/)
