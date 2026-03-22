/**
 * Per-product sale pricing (owner-defined). Applied after branch price override:
 * listUnit = branchOverride ?? basePrice; effectiveUnit = applySale(listUnit, ...).
 * Promotion bundle rules in the customer app run on top of these prices.
 */

export type SaleDiscountType = 'PERCENTAGE' | 'FIXED';

export type ProductSaleFields = {
  saleDiscountType: SaleDiscountType | null | undefined;
  saleDiscountValue: string | number | null | undefined;
  saleLabel?: string | null | undefined;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Returns effective unit price after applying optional product-level sale.
 */
export function applyProductSale(
  listUnitPrice: number,
  sale: ProductSaleFields | null | undefined,
): number {
  if (!sale?.saleDiscountType || sale.saleDiscountValue == null || sale.saleDiscountValue === '') {
    return round2(listUnitPrice);
  }
  const raw = typeof sale.saleDiscountValue === 'number'
    ? sale.saleDiscountValue
    : parseFloat(String(sale.saleDiscountValue));
  if (Number.isNaN(raw) || raw < 0) {
    return round2(listUnitPrice);
  }
  if (sale.saleDiscountType === 'PERCENTAGE') {
    const pct = Math.min(100, Math.max(0, raw));
    return round2(Math.max(0, listUnitPrice * (1 - pct / 100)));
  }
  return round2(Math.max(0, listUnitPrice - raw));
}

/**
 * Effective price + optional compare-at (list) when sale reduces price.
 */
export function resolveProductMenuPrice(
  listUnitPrice: number,
  sale: ProductSaleFields | null | undefined,
): { price: number; compareAtPrice?: number; saleLabel?: string | null } {
  const effective = applyProductSale(listUnitPrice, sale);
  const label = sale?.saleLabel?.trim() || null;
  if (effective < listUnitPrice - 0.001) {
    return {
      price: effective,
      compareAtPrice: round2(listUnitPrice),
      saleLabel: label || undefined,
    };
  }
  return { price: effective, saleLabel: label || undefined };
}
