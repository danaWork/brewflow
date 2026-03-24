import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: number;
  /** List price before sale (optional) */
  compareAtPrice?: number;
  saleLabel?: string | null;
  image: string | null;
  isSignature: boolean;
  isInStock?: boolean;
}

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  type?: 'drinks' | 'snacks' | 'meals';
}

export default function ProductCard({ product, onClick, type = 'drinks' }: ProductCardProps) {
  // Format price
  const formattedPrice = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(product.price);

  const handleClick = () => {
    if (product.isInStock !== false) {
      onClick?.();
    }
  };

  return (
    <div 
      className={`bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden ${product.isInStock !== false ? 'cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)]' : 'opacity-75 cursor-not-allowed'} transition-shadow duration-300 relative`}
      onClick={handleClick}
    >
      {product.isInStock === false && (
        <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-3 py-1 rounded-full font-bold text-sm">Out of Stock</span>
        </div>
      )}
      <div className="relative h-64 w-full bg-gray-100">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">
            <span className="text-3xl">☕</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-900 text-lg leading-tight">{product.name}</h3>
          
          {/* Featured Badge */}
          {product.isSignature && (
            <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 text-[10px] font-bold px-3 py-1 border border-yellow-200 rounded-[4px]">
              <span className="text-yellow-600">★</span>
              Featured
            </span>
          )}
        </div>
        
        <div className="flex flex-col gap-1">
          {product.compareAtPrice != null && product.compareAtPrice > product.price && (
            <span className="text-sm text-gray-400 line-through">
              {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(product.compareAtPrice)}
            </span>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xl font-bold text-gray-900">{formattedPrice}</p>
            {product.saleLabel ? (
              <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded">{product.saleLabel}</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
