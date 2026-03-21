'use client';

import { useState, useMemo } from 'react';
import MenuHeader from './MenuHeader';
import CategoryFilter from './CategoryFilter';
import ProductCard from './ProductCard';
import TypeToggle from './TypeToggle';
import { Search, X } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');

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

    let finalProducts = productsInType;
    if (activeCategory !== 'all') {
      finalProducts = productsInType.filter((p) => p.categoryId === activeCategory);
    }

    // Order comes from server (owner-defined sort_order)
    let sortedProducts = finalProducts;

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      sortedProducts = sortedProducts.filter(p => 
        (p.name?.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query))
      );
    }

    return sortedProducts;
  }, [activeCategory, products, filteredCategories, searchQuery]);

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="sticky top-0 z-20 bg-white shadow-sm">
        <MenuHeader tableId={tableId} />

        <div className="px-4 py-2 bg-white">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#D95D1E] focus:border-[#D95D1E] sm:text-sm transition-colors duration-200"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

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
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-gray-200 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? `No results for "${searchQuery}"` : "Try selecting a different category"}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-sm font-medium text-[#D95D1E] hover:text-[#b84a14]"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
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
        )}
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
