import { Metadata } from 'next';
import { POSClient } from '@/components/owner/pos/POSClient';
import { getMenuCategoriesForPOS } from '@/app/actions/menu-management';
import { getPromotionsAction } from '@/app/actions/promotions';
import { getUserSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'POS Terminal',
};

export const revalidate = 0;

function mapProduct(p: any) {
  const basePrice = p.basePrice ?? p.base_price;
  const modifiers = (p.modifierLinks || []).map((ml: any) => {
    const group = ml.modifierGroup || ml.modifier_group;
    if (!group) return null;
    const opts = group.options || [];
    return {
      id: group.id,
      name: group.name,
      displayMode: group.displayMode ?? group.display_mode ?? 'list',
      defaultModifierOptionId: ml.defaultModifierOptionId ?? ml.default_modifier_option_id ?? null,
      options: opts.map((o: any) => ({
        id: o.id,
        name: o.name,
        price: parseFloat(o.price || '0'),
        image: o.imageUrl ?? o.image_url ?? null,
      })),
    };
  }).filter(Boolean);
  return {
    id: p.id,
    categoryId: p.categoryId ?? p.category_id,
    name: p.name,
    basePrice,
    imageUrl: p.imageUrl ?? p.image_url ?? null,
    image: p.imageUrl ?? p.image_url ?? null,
    isHidden: p.isHidden ?? p.is_hidden ?? false,
    isFeatured: p.isFeatured ?? p.is_featured ?? false,
    modifiers,
  };
}

export default async function POSPage() {
  const session = await getUserSession();
  if (!session || !session.branchId) {
    redirect('/login');
  }

  const raw = await getMenuCategoriesForPOS();
  const categories = (Array.isArray(raw) ? raw : []).map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    type: cat.type || 'drink',
    products: (cat.products || []).map(mapProduct),
  }));

  const productIdToCategoryType: Record<string, string> = {};
  categories.forEach((cat: { type: string; products: { id: string }[] }) => {
    cat.products.forEach((p: { id: string }) => {
      productIdToCategoryType[p.id] = cat.type;
    });
  });

  const promotionsRes = await getPromotionsAction(session.branchId);
  const rawPromos = promotionsRes.success && promotionsRes.data ? promotionsRes.data : [];
  const promotions = rawPromos.map((p: any) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    triggerType: p.triggerType,
    triggerValue: p.triggerValue,
    discountType: p.discountType,
    discountValue: p.discountValue,
    isActive: p.isActive !== false,
    items: (p.items || []).map((i: any) => ({ productId: i.productId || i.product?.id })),
  }));

  return (
    <POSClient
      categories={categories}
      branchId={session.branchId}
      promotions={promotions}
      productIdToCategoryType={productIdToCategoryType}
    />
  );
}
