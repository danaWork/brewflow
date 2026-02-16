'use client';

import { useState } from 'react';
import { ArrowLeft, Star, Calculator, Check, Flame, X, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import InfoPopup from '@/components/ui/InfoPopup';

interface ProductDrawerContentProps {
  product: any;
  promotions: any[];
  allProducts: any[];
  onClose: () => void;
}

type Step = 'size' | 'customization' | 'toppings' | 'upsell' | 'frequentlyBought' | 'cart';



export default function ProductDrawerContent({ product, promotions, allProducts, onClose }: ProductDrawerContentProps) {
  const { addItem } = useCart();
  const [step, setStep] = useState<Step>('size');

  // Form State
  const [size, setSize] = useState('medium');
  const [milk, setMilk] = useState('regular');
  const [sweetness, setSweetness] = useState('75%');
  const [ice, setIce] = useState('normal');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [showAllToppings, setShowAllToppings] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  // Info Modal State
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [activeInfoId, setActiveInfoId] = useState<string | null>(null);

  const handleInfoClick = (id: string) => {
    setActiveInfoId(id);
    setInfoModalOpen(true);
  };

  // Info Content Data
  // Info Content Data
  const infoContent: Record<string, { title: string, subtitle: string, items: { emoji: string, title: string, desc: string }[] }> = {
    'oat': {
      title: 'Oat Milk',
      subtitle: 'Health & Wellness Benefits',
      items: [
        { emoji: '💚', title: 'Low in calories', desc: 'Only 30 calories per serving. Perfect for guilt-free enjoyment without compromising on taste or creaminess.' },
        { emoji: '⚡', title: 'Rich in vitamins & minerals', desc: 'Packed with calcium, vitamin D, and minerals. Boosts energy and supports bone health naturally.' },
        { emoji: '🌿', title: 'Supports digestion', desc: 'Easier to digest than regular milk. Gentle on the stomach while providing great taste and nutrition.' }
      ]
    },
    'almond': {
      title: 'Almond Milk',
      subtitle: 'Health & Wellness Benefits',
      items: [
        { emoji: '🌱', title: 'Plant-based', desc: '100% plant-based alternative. Rich in essential nutrients for optimal health and wellness.' },
        { emoji: '🛡️', title: 'Boosts immunity', desc: 'Rich in antioxidants and essential nutrients. Daily wellness support for a stronger immune system.' },
      ]
    }
  };



  // ... (keeping existing logic before return) ...

  // We need to inject the InfoPopup at the end of the component return or wrap it.
  // Since we are inside the component body, I will preserve the existing logic and append the modal.
  // However, since I cannot easily "append" to the JSX return without rewriting the whole return structure which is huge,
  // I will rewrite the whole component body is too big. 
  // Instead, I will rewrite the START to add imports/state, and modify the Render common logic if possible.
  // Wait, I can't reuse "keeping existing logic". 
  // I will try to use the multi_replace effectively. 
  // Actually, I'll rewrite the imports at the top first, then the state, then replace the handleInfoClick logic inline, then handle the end of file return.

  // Mock Toppings Data... (rest of file)


  // Mock Toppings Data
  const toppingsList = [
    { id: 'egg-pudding', name: 'Egg Pudding', price: 25, image: 'https://images.unsplash.com/photo-1595246733973-77291a18c64d?q=80&w=400&fit=crop' },
    { id: 'coconut-jelly', name: 'Coconut Jelly', price: 25, image: 'https://images.unsplash.com/photo-1548842148-39b4b0257375?q=80&w=400&fit=crop', isPopular: true },
    { id: 'pearls', name: 'Tapioca Pearls', price: 20, image: 'https://images.unsplash.com/photo-1629871584877-628424294026?q=80&w=400&fit=crop' },
    { id: 'cheese-foam', name: 'Cheese Foam', price: 30, image: 'https://images.unsplash.com/photo-1610459747190-67c870404d80?q=80&w=400&fit=crop' },
  ];

  // Pricing Logic (Mock)
  const basePrice = product.price;
  const sizePrice = size === 'large' ? 50 : size === 'medium' ? 25 : 0;
  const milkPrice = milk === 'oat' || milk === 'almond' ? 25 : 0;
  const toppingsPrice = selectedToppings.reduce((total, tId) => {
    const topping = toppingsList.find(t => t.id === tId);
    return total + (topping ? topping.price : 0);
  }, 0);

  const visibleToppings = showAllToppings ? toppingsList : toppingsList.slice(0, 2);

  const currentPrice = basePrice + sizePrice + milkPrice + toppingsPrice;

  // --- Promotion Logic ---

  // 1. Find Perfect Pair Bundle for this specific product
  const bundlePromo = promotions.find(p =>
    p.type === 'PERFECT_PAIR' && p.triggerValue === product.id
  );

  // 2. Find Cross-Sell for this category type (drink/snack)
  const crossSellPromo = promotions.find(p =>
    p.type === 'CROSS_SELL' && p.triggerValue === product.categoryType
  );

  const handleAddToCart = (overrideExtras?: any[], overrideLabel?: string) => {
    // Resolve toppings to objects
    const resolvedToppings = selectedToppings.map(tId => {
      const topping = toppingsList.find(t => t.id === tId);
      return topping ? { name: topping.name, price: topping.price } : null;
    }).filter(Boolean);

    // Add main item with potential extras
    addItem({
      productId: product.id,
      name: product.name,
      price: currentPrice,
      quantity: 1,
      image: product.image,
      options: { size, milk, sweetness, ice, toppings: resolvedToppings },
      bundleLabel: overrideLabel,
      extras: overrideExtras
    });

    onClose();
  };

  const calculateDiscountedPrice = (item: any, promo: any) => {
    const price = parseFloat(item.price || item.basePrice || '0');
    if (promo.discountType === 'PERCENTAGE') {
      return price * (1 - parseFloat(promo.discountValue) / 100);
    } else {
      return Math.max(0, price - parseFloat(promo.discountValue));
    }
  };

  const handleUpsellAndAdd = () => {
    if (!bundlePromo) return;

    const pairedProductId = bundlePromo.items[0]?.productId;
    const pairedProduct = allProducts.find(p => p.id === pairedProductId);

    if (!pairedProduct) {
      handleAddToCart();
      return;
    }

    const discountedPrice = calculateDiscountedPrice(pairedProduct, bundlePromo);

    const bundleItem = {
      productId: pairedProduct.id,
      name: pairedProduct.name,
      price: discountedPrice,
      quantity: 1,
      image: pairedProduct.image,
      options: {},
      tag: 'TOGETHER'
    };

    handleAddToCart([bundleItem], bundlePromo.name || 'Perfect Pair Bundle');
  };

  const handleAddWithExtras = () => {
    if (!crossSellPromo) {
      handleAddToCart();
      return;
    }

    const extrasToAdd = selectedExtras.map(id => {
      const item = allProducts.find(i => i.id === id);
      if (!item) return null;

      const discountedPrice = calculateDiscountedPrice(item, crossSellPromo);

      return {
        productId: item.id,
        name: item.name,
        price: discountedPrice,
        quantity: 1,
        image: item.image,
        options: {},
        tag: 'TOGETHER'
      };
    }).filter(Boolean);

    handleAddToCart(extrasToAdd as any[]);
  };

  const toggleTopping = (id: string) => {
    setSelectedToppings(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  }

  const handleToppingsContinue = () => {
    if (bundlePromo) {
      setStep('upsell');
    } else if (crossSellPromo && crossSellPromo.items.length > 0) {
      setStep('frequentlyBought');
    } else {
      handleAddToCart();
    }
  };

  const handleUpsellSkip = () => {
    if (crossSellPromo && crossSellPromo.items.length > 0) {
      setStep('frequentlyBought');
    } else {
      handleAddToCart();
    }
  };

  // Helper to render Common Header Image
  const HeaderImage = ({ compact = false }: { compact?: boolean }) => (
    <div className={`relative w-full shrink-0 ${compact ? 'h-40' : 'h-64'}`}>
      {/* Top Gradient for button visibility */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/10 to-transparent z-10" />

      {/* Bottom Gradient for text readability */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent z-10" />

      <Image
        src={product.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1000&auto=format&fit=crop'}
        alt={product.name}
        fill
        className="object-cover"
      />

      {/* Navigation Buttons */}
      <div className="absolute top-4 left-4 right-4 flex justify-between z-20">
        {step !== 'size' ? (
          <button
            onClick={() => {
              if (step === 'customization') setStep('size');
              if (step === 'toppings') setStep('customization');
              if (step === 'upsell') setStep('toppings');
            }}
            className="bg-white p-2 rounded-lg shadow-sm text-gray-900 transition-transform active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
        ) : <div /> /* Spacer if no back button */}

        <button
          onClick={onClose}
          className="bg-white p-2 rounded-lg shadow-sm text-gray-900 transition-transform active:scale-95"
        >
          <X size={20} />
        </button>
      </div>

      {/* Title Overlay */}
      <div className="absolute bottom-4 left-6 right-6 z-20">
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">{product.name}</h2>
      </div>
    </div>
  );

  // Footer Component
  const StickyFooter = ({ label = "Continue", onClick }: { label?: string, onClick?: () => void }) => (
    <div className="p-4 bg-white border-t border-gray-100 mt-auto">
      <button
        onClick={onClick}
        className="w-full bg-[#D95D1E] text-white font-bold py-4 rounded-xl text-lg flex justify-between px-6 shadow-lg shadow-orange-200 hover:bg-[#c4531b] transition-colors border border-black"
      >
        <span>{label}</span>
        <span>₱{currentPrice.toFixed(2)}</span>
      </button>
    </div>
  );

  // --- STEP 1: SIZE ---
  if (step === 'size') {
    return (
      <>
        <div className="flex flex-col h-full bg-white">
          <HeaderImage />
          <div className="p-6 flex-1 overflow-y-auto pt-2">
            {/* Title moved to HeaderImage */}

            <h3 className="font-semibold text-gray-900 mb-4 text-lg">Choose your size</h3>
            <div className="space-y-3">
              {['small', 'medium', 'large'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all ${size === s
                    ? 'bg-[#D95D1E] text-white border-black'
                    : 'border-transparent bg-gray-50 text-gray-600'
                    }`}
                >
                  <span className="capitalize font-medium text-lg">{s}</span>
                  <span className="text-sm font-medium">
                    {s === 'small' ? 'Base price' : `+₱${s === 'medium' ? '25.00' : '50.00'}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <StickyFooter onClick={() => setStep('customization')} />
        </div>
      </>
    );
  }

  // --- STEP 2: CUSTOMIZATION ---
  if (step === 'customization') {
    return (
      <>
        <div className="flex flex-col h-full bg-white">
          <HeaderImage compact />
          <div className="p-6 flex-1 overflow-y-auto pb-32">

            <div className="flex items-center gap-2 mb-6">
              <img
                src="/icons/magic-stick-3-svgrepo-com.svg"
                alt="Magic"
                className="w-5 h-5"
                style={{ filter: 'invert(48%) sepia(68%) saturate(3474%) hue-rotate(346deg) brightness(93%) contrast(92%)' }}
              />
              <span className="text-black font-bold text-sm">
                Make it yours
              </span>
            </div>

            {/* Milk */}
            <div className="space-y-4 mb-8">
              <h3 className="font-semibold text-gray-900">Milk</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setMilk('regular')}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all font-medium ${milk === 'regular' ? 'bg-[#D95D1E] text-white border-black' : 'border-gray-200 text-gray-600'
                    }`}
                >
                  Regular Milk
                </button>
                {[
                  { id: 'oat', label: 'Oat Milk', price: 25, recommended: true },
                  { id: 'almond', label: 'Almond Milk', price: 25 }
                ].map((m) => (
                  <div key={m.id} className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl border transition-all ${milk === m.id ? 'bg-[#D95D1E] border-black' : 'border-gray-100'
                    }`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Just in case
                        handleInfoClick(m.id);
                      }}
                      className="p-2 shrink-0 relative z-20 opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <img
                        src="/icons/info-circle-svgrepo-com.svg"
                        alt="Info"
                        className={`w-5 h-5 block ${milk === m.id ? 'brightness-0 invert' : ''}`}
                      />
                    </button>

                    <div
                      role="button"
                      onClick={() => setMilk(m.id)}
                      className="flex-1 flex justify-between items-center py-1 pr-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${milk === m.id ? 'text-white' : 'text-gray-600'}`}>{m.label}</span>
                        {m.recommended && <Star size={14} className="fill-yellow-400 text-yellow-400" />}
                      </div>
                      <span className={`text-sm font-medium ${milk === m.id ? 'text-white' : 'text-gray-500'}`}>+₱{m.price}.00</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sweetness */}
            <div className="space-y-4 mb-8">
              <h3 className="font-semibold text-gray-900">Sweetness</h3>
              <div className="flex justify-between gap-2 p-1 bg-gray-50 rounded-xl">
                {['25%', '50%', '75%', '100%'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setSweetness(val)}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all shadow-sm ${sweetness === val ? 'bg-[#D95D1E] text-white shadow-md border border-black' : 'bg-transparent text-gray-500 hover:bg-gray-200 border border-transparent'
                      }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Ice */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Ice Level</h3>
              <div className="flex flex-wrap gap-2">
                {['Normal', 'Less', 'None'].map(level => (
                  <button
                    key={level}
                    onClick={() => setIce(level.toLowerCase())}
                    className={`px-6 py-3 rounded-xl text-sm font-bold border transition-colors ${ice === level.toLowerCase()
                      ? 'bg-[#D95D1E] text-white border-black'
                      : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
                      }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <StickyFooter onClick={() => setStep('toppings')} />
        </div>
        {activeInfoId && infoContent[activeInfoId] && (
          <InfoPopup
            isOpen={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title={infoContent[activeInfoId].title}
            subtitle={infoContent[activeInfoId].subtitle}
          >
            {infoContent[activeInfoId].items.map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="shrink-0 text-2xl">
                  {item.emoji}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 leading-none mb-1">{item.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </InfoPopup>
        )}
      </>
    );
  }

  // --- STEP 3: TOPPINGS ---
  if (step === 'toppings') {
    return (
      <>
        <div className="flex flex-col h-full bg-white">
          <HeaderImage compact />
          <div className="p-6 flex-1 overflow-y-auto">

            <div className="flex items-center gap-2 text-black font-bold mb-6">
              <span className=" flex items-center gap-2 text-sm">
                ✨ Make it Perfect
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {visibleToppings.map(topping => {
                const isSelected = selectedToppings.includes(topping.id);
                return (
                  <button
                    key={topping.id}
                    onClick={() => toggleTopping(topping.id)}
                    className={`relative group rounded-xl overflow-hidden border-2 text-left transition-all ${isSelected ? 'border-black shadow-md' : 'border-gray-100 hover:border-gray-200'
                      }`}
                  >
                    <div className="aspect-square relative w-full h-32 bg-gray-100">
                      <Image src={topping.image} alt={topping.name} fill className="object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#D95D1E]/20 flex items-center justify-center">
                          <div className="bg-white rounded-full p-1 shadow-sm">
                            <Check size={16} className="text-[#D95D1E]" strokeWidth={3} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-white">
                      <h4 className="font-bold text-gray-900 text-sm leading-tight mb-1">{topping.name}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">+₱{topping.price}</span>
                        {topping.isPopular && <span className="text-sm">🔥</span>}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setShowAllToppings(!showAllToppings)}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 py-2"
            >
              {showAllToppings ? (
                <>Show less <ChevronUp size={16} /></>
              ) : (
                <>See all toppings <ChevronDown size={16} /></>
              )}
            </button>
          </div>
          <StickyFooter onClick={handleToppingsContinue} />
        </div>
      </>
    );
  }


  // --- STEP 4: UPSELL (Dynamic) ---
  if (step === 'upsell' && bundlePromo) {
    const pairedProductId = bundlePromo.items[0]?.productId;
    const pairedProduct = allProducts.find(p => p.id === pairedProductId);

    return (
      <>
        <div className="flex flex-col h-full bg-gray-50">
          <div className="p-4 bg-white relative">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setStep('toppings')} className="text-gray-500 hover:text-gray-900 p-2">
                <ArrowLeft size={20} />
              </button>
              <button onClick={handleUpsellSkip} className="text-gray-400 font-medium text-sm px-2">Skip</button>
            </div>
          </div>

          <div className="p-4 flex-1">
            <div className="bg-white rounded-3xl p-5 shadow-sm space-y-6">
              <div className="relative rounded-2xl overflow-hidden h-56 w-full shadow-inner">
                <div className="absolute top-4 left-4 z-10 bg-[#D95D1E] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                  <Check size={12} strokeWidth={3} /> Best Value
                </div>
                <div className="flex w-full h-full">
                  <div className="w-1/2 relative h-full">
                    <Image
                      src={product.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1000&auto=format&fit=crop'}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="w-1/2 relative h-full">
                    <Image
                      src={pairedProduct?.image || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800'}
                      alt={pairedProduct?.name || 'Pair'}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="text-center space-y-3 px-2">
                <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                  {product.name} + <br /> {pairedProduct?.name}
                </h3>
                <p className="text-[#D95D1E] font-semibold bg-orange-50 inline-block px-4 py-2 rounded-lg text-sm">
                  Make it a Meal!
                  {bundlePromo.discountType === 'PERCENTAGE'
                    ? ` Save ${bundlePromo.discountValue}% on ${pairedProduct?.name}! ✨`
                    : ` Only ₱${calculateDiscountedPrice(pairedProduct, bundlePromo).toFixed(2)} for ${pairedProduct?.name}! 🔥`}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-auto p-4 bg-white border-t border-gray-100">
            <button
              onClick={handleUpsellAndAdd}
              className="w-full bg-[#D95D1E] text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-orange-200 hover:bg-[#c4531b] transition-colors border border-black"
            >
              Yes, Perfect!
            </button>
          </div>
        </div>
      </>
    );
  }


  // --- STEP 5: FREQUENTLY BOUGHT (Dynamic) ---
  if (step === 'frequentlyBought' && crossSellPromo) {
    const items = crossSellPromo.items.map((li: any) => allProducts.find((p: any) => p.id === li.productId)).filter(Boolean);

    const toggleExtra = (id: string) => {
      setSelectedExtras(prev =>
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    };

    const extrasTotal = selectedExtras.reduce((total, id) => {
      const item = items.find((i: any) => i.id === id);
      if (!item) return total;
      return total + calculateDiscountedPrice(item, crossSellPromo);
    }, 0);

    const finalTotalPrice = currentPrice + extrasTotal;

    return (
      <div className="flex flex-col h-full bg-white">
        <div className="p-4 bg-white relative border-b border-gray-50">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => bundlePromo ? setStep('upsell') : setStep('toppings')} className="text-gray-500 hover:text-gray-900 p-2">
              <ArrowLeft size={20} />
            </button>
            <button onClick={() => handleAddToCart()} className="text-gray-400 font-medium text-sm px-2">Skip</button>
          </div>
          <div className="px-2">
            <h2 className="text-xl font-bold text-gray-900 leading-tight">Frequently bought together</h2>
            <p className="text-[#D95D1E] text-xs font-bold mt-1 uppercase tracking-wider">
              {crossSellPromo.discountType === 'PERCENTAGE' ? `Save ${crossSellPromo.discountValue}% on each items` : `₱${crossSellPromo.discountValue} OFF on each items`}
            </p>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            {items.map((item: any) => {
              const isSelected = selectedExtras.includes(item.id);
              const discountedPrice = calculateDiscountedPrice(item, crossSellPromo);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleExtra(item.id)}
                  className={`bg-white rounded-2xl p-3 shadow-sm border text-left flex flex-col h-full transition-all ${isSelected ? 'border-[#D95D1E] ring-1 ring-[#D95D1E] bg-orange-50/10' : 'border-gray-100'
                    }`}
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-gray-100 w-full">
                    <Image src={item.image || 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?q=80&w=400&fit=crop'} alt={item.name} fill className="object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                        <div className="bg-[#D95D1E] text-white rounded-full p-1.5 shadow-sm">
                          <Check size={16} strokeWidth={3} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col w-full">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">{item.name}</h3>
                    <div className="mt-auto">
                      <span className="text-xs text-gray-400 line-through mr-2">₱{parseFloat(item.price || item.basePrice || '0').toFixed(2)}</span>
                      <span className="text-[#D95D1E] font-bold text-lg">₱{discountedPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-4 bg-white border-t border-gray-100 mt-auto">
          <button
            onClick={handleAddWithExtras}
            className="w-full bg-[#D95D1E] text-white font-bold py-4 rounded-xl text-lg flex justify-between px-6 shadow-lg shadow-orange-200 hover:bg-[#c4531b] transition-colors border border-black"
          >
            <span>{selectedExtras.length > 0 ? 'Add with deals' : 'Add to Cart'}</span>
            <span>₱{finalTotalPrice.toFixed(2)}</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
