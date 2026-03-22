import { describe, it, expect } from 'vitest';
import { applyProductSale, resolveProductMenuPrice } from './product-sale-price';

describe('applyProductSale', () => {
  it('returns list price when no sale', () => {
    expect(applyProductSale(100, null)).toBe(100);
    expect(applyProductSale(100, {})).toBe(100);
  });

  it('applies percentage', () => {
    expect(applyProductSale(100, { saleDiscountType: 'PERCENTAGE', saleDiscountValue: 10 })).toBe(90);
    expect(applyProductSale(100, { saleDiscountType: 'PERCENTAGE', saleDiscountValue: '25' })).toBe(75);
  });

  it('applies fixed', () => {
    expect(applyProductSale(100, { saleDiscountType: 'FIXED', saleDiscountValue: 15 })).toBe(85);
    expect(applyProductSale(100, { saleDiscountType: 'FIXED', saleDiscountValue: '100' })).toBe(0);
  });
});

describe('resolveProductMenuPrice', () => {
  it('sets compareAt when sale reduces price', () => {
    const r = resolveProductMenuPrice(200, {
      saleDiscountType: 'PERCENTAGE',
      saleDiscountValue: 20,
      saleLabel: 'Sale',
    });
    expect(r.price).toBe(160);
    expect(r.compareAtPrice).toBe(200);
    expect(r.saleLabel).toBe('Sale');
  });
});
