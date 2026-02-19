'use client';

import { useState, useMemo } from 'react';
import MenuHeader from './MenuHeader';
import CategoryFilter from './CategoryFilter';
import ProductCard from './ProductCard';
import TypeToggle from './TypeToggle';

interface MenuClientProps {
  tableId: string;
  tableName: string;
  branchId: string;
  categories: any[];
  products: any[];
  promotions: any[];
}

import Drawer from '@/components/ui/Drawer';
import ProductDrawerContent from './ProductDrawerContent';
import CartFloatingBar from './CartFloatingBar';
import FloatingOrderTabs from './FloatingOrderTabs';
import { useTable } from '@/context/TableContext';
import { useEffect } from 'react';

export default function MenuClient({ tableId, tableName, branchId, categories, products, promotions }: MenuClientProps) {
  const { setTableInfo } = useTable();

  useEffect(() => {
    if (tableId && tableName && branchId) {
      setTableInfo(tableId, tableName, branchId);
    }
  }, [tableId, tableName, branchId, setTableInfo]);

  const [activeCategory, setActiveCategory] = useState('all');
  const [activeType, setActiveType] = useState<'drinks' | 'snacks'>('drinks');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      const cType = c.type || 'drink';
      return activeType.startsWith(cType);
    });
  }, [categories, activeType]);

  useEffect(() => {
    const activeCatExists = filteredCategories.find(c => c.id === activeCategory);
    if (activeCategory !== 'all' && !activeCatExists) {
      setActiveCategory('all');
    }
  }, [activeCategory, filteredCategories]);

  const filteredProducts = useMemo(() => {
    const visibleCategoryIds = filteredCategories.map(c => c.id);
    const productsInType = products.filter(p => visibleCategoryIds.includes(p.categoryId));

    if (activeCategory === 'all') {
      return productsInType;
    }
    return productsInType.filter((p) => p.categoryId === activeCategory);
  }, [activeCategory, products, filteredCategories]);

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="sticky top-0 z-20 bg-white shadow-sm">
        <MenuHeader tableId={tableId} />

        <div className="border-b border-gray-100">
          <TypeToggle activeType={activeType} onToggle={setActiveType} />
        </div>

        <div className="py-2 border-b border-gray-50">
          <CategoryFilter
            categories={filteredCategories}
            activeCategoryId={activeCategory}
            onSelectCategory={setActiveCategory}
            activeType={activeType}
          />
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              type={activeType}
              onClick={() => handleProductClick(product)}
            />
          ))}
        </div>
      </div>

      <FloatingOrderTabs />
      <CartFloatingBar />

      <Drawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        showCloseButton={false}
      >
        {selectedProduct && (
          <ProductDrawerContent
            product={selectedProduct}
            category={categories.find(c => c.id === selectedProduct.categoryId)}
            promotions={promotions}
            allProducts={products}
            onClose={handleCloseDrawer}
          />
        )}
      </Drawer>
    </div>
  );
}
