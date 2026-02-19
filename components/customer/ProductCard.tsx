import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string | null;
  isSignature: boolean;
  isInStock?: boolean;
}

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  type?: 'drinks' | 'snacks';
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
          
          {/* Drinks Badge: Star + Signature */}
          {product.isSignature && type === 'drinks' && (
            <span className="flex items-center gap-1 bg-gray-100 text-black text-[10px] font-bold px-3 py-1 border border-black rounded-[4px]">
              <Image 
                src="/icons/star-shape-1-svgrepo-com.svg" 
                alt="Signature" 
                width={14} 
                height={14} 
              />
              Signature
            </span>
          )}

          {/* Snacks Badge: Most Popular + Fire */}
          {product.isSignature && type === 'snacks' && (
            <span className="flex items-center gap-1 bg-[#D95D1E] text-white text-[10px] font-bold px-3 py-1 rounded-md">
              <Image 
                src="/icons/fire-minimalistic-svgrepo-com.svg" 
                alt="Most Popular" 
                width={12} 
                height={12}
                className="brightness-0 invert" 
              />
              Most Popular
            </span>
          )}
        </div>
        
        <p className="text-xl font-bold text-gray-900">{formattedPrice}</p>
      </div>
    </div>
  );
}
