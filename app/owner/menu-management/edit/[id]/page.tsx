import { db } from '@/lib/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserSession } from '@/app/actions/auth';
import {
  getInventoryItemsAction,
  getProductIngredientsAction,
  getProductModifierOptionIngredientsAction,
} from '@/app/actions/inventory';
import ProductRecipeEditor from '@/components/products/ProductRecipeEditor';
import ModifierOptionRecipeEditor from '@/components/products/ModifierOptionRecipeEditor';
import { getModifierGroups, getProductModifiers } from '@/app/actions/menu-management';
import { redirect } from 'next/navigation';
import { requireManagerRole } from '@/lib/roleGuard';

export default async function EditMenuItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireManagerRole();
  const session = await getUserSession();

  if (!session) {
    redirect('/login');
  }

  const branchId = session.branchId || '';
  if (!branchId) return <div>Error: Branch not found</div>;

  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);

  if (!product) {
    return <div>Product not found</div>;
  }

  const [ingredientsRes, inventoryRes, modIngRes, linkedGroupIds, allModifierGroups] = await Promise.all([
    getProductIngredientsAction(branchId, id),
    getInventoryItemsAction(branchId),
    getProductModifierOptionIngredientsAction(branchId, id),
    getProductModifiers(id),
    getModifierGroups(),
  ]);

  const linkedGroupIdSet = new Set(linkedGroupIds);
  const linkedGroups = allModifierGroups
    .filter((g) => linkedGroupIdSet.has(g.id))
    .map((g) => ({
      id: g.id,
      name: g.name,
      displayMode: g.displayMode,
      options: (g.options || []).map((o: { id: string; name: string; price: string; imageUrl: string | null }) => ({
        id: o.id,
        name: o.name,
        price: o.price,
        imageUrl: o.imageUrl,
      })),
    }));

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Menu Item: {product.name}</h1>
        <p className="text-gray-500">Manage pricing, details, and recipe.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="font-semibold mb-4">Product Details</h2>
        <p>Base Price: {product.basePrice}</p>
        <p className="text-sm text-gray-400 mt-2">To edit product details, use the main menu management list (functionality TBD in other tasks).</p>
      </div>

      <ProductRecipeEditor
        branchId={branchId}
        productId={id}
        initialIngredients={ingredientsRes.ingredients || []}
        inventoryItems={inventoryRes.items || []}
      />

      <ModifierOptionRecipeEditor
        branchId={branchId}
        productId={id}
        linkedGroups={linkedGroups}
        inventoryItems={inventoryRes.items || []}
        initialModifierIngredients={
          modIngRes.success && modIngRes.ingredients ? modIngRes.ingredients : []
        }
      />
    </div>
  );
}

