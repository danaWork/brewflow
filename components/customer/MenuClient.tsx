'use client';

import { useState, useMemo } from 'react';
import MenuHeader from './MenuHeader';
import CategoryFilter from './CategoryFilter';
import ProductCard from './ProductCard';
import TypeToggle from './TypeToggle';

interface MenuClientProps {
  tableId: string;
  tableName: string;
  categories: any[];
  products: any[];
}

import Drawer from '@/components/ui/Drawer';
import ProductDrawerContent from './ProductDrawerContent';
import CartFloatingBar from './CartFloatingBar';
import FloatingOrderTabs from './FloatingOrderTabs';
import { useTable } from '@/context/TableContext';
import { useEffect } from 'react';

export default function MenuClient({ tableId, tableName, categories, products }: MenuClientProps) {
  const { setTableInfo } = useTable();

  useEffect(() => {
    if (tableId && tableName) {
      setTableInfo(tableId, tableName);
    }
  }, [tableId, tableName, setTableInfo]);

  const [activeCategory, setActiveCategory] = useState('all');
  const [activeType, setActiveType] = useState<'drinks' | 'snacks'>('drinks');
  
  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    // Optional: wait for animation to clear before clearing data, 
    // but clearing immediately hides content during slide-down. 
    // Usually better to keep data until close.
  };

  // Determine available categories based on activeType
  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      // If type exists check it, otherwise assume everything is a 'drink' (fallback)
      const cType = c.type || 'drink';
      // Match simple plural/singular logic or strict match if seeded correctly
      // Our seed uses 'drink' and 'snack' (singular). Toggle uses 'drinks'/'snacks' (plural).
      return activeType.startsWith(cType); 
    });
  }, [categories, activeType]);

  // Reset activeCategory when activeType changes if current activeCategory is not in the new list
  const activeCatExists = filteredCategories.find(c => c.id === activeCategory);
  if (activeCategory !== 'all' && !activeCatExists) {
     setActiveCategory('all');
  }

  const filteredProducts = useMemo(() => {
    // 1. Filter products that belong to the visible categories
    const visibleCategoryIds = filteredCategories.map(c => c.id);
    const productsInType = products.filter(p => visibleCategoryIds.includes(p.categoryId));

    // 2. Filter by specific category selection
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
        // title={selectedProduct?.name} // Custom header in content instead
        showCloseButton={false} 
      >
        {selectedProduct && (
          <ProductDrawerContent 
            product={selectedProduct} 
            onClose={handleCloseDrawer} 
          />
        )}
      </Drawer>
    </div>
  );
}
