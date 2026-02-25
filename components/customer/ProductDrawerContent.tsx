"use client";

import { useState } from "react";
import { ArrowLeft, X, Minus, Plus, Check } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import InfoPopup from "@/components/ui/InfoPopup";

interface ProductDrawerContentProps {
  product: any;
  category?: any;
  promotions: any[];
  allProducts: any[];
  onClose: () => void;
}

type Step =
  | "size"
  | "customization"
  | "toppings"
  | "upsell"
  | "quantity"
  | "frequentlyBought"
  | "dynamic_options"
  | "cart";

// Static Info Content for specific modifiers
const MODIFIER_INFO: Record<
  string,
  {
    title: string;
    subtitle: string;
    items: { emoji: string; title: string; desc: string }[];
  }
> = {
  "oat milk": {
    title: "Oat Milk",
    subtitle: "Health & Wellness Benefits",
    items: [
      {
        emoji: "💚",
        title: "Low in calories",
        desc: "Only 30 calories per serving. Perfect for guilt-free enjoyment without compromising on taste or creaminess.",
      },
      {
        emoji: "⚡",
        title: "Rich in vitamins & minerals",
        desc: "Packed with calcium, vitamin D, and minerals. Boosts energy and supports bone health naturally.",
      },
      {
        emoji: "🌿",
        title: "Supports digestion",
        desc: "Easier to digest than regular milk. Gentle on the stomach while providing great taste and nutrition.",
      },
    ],
  },
  "almond milk": {
    title: "Almond Milk",
    subtitle: "Health & Wellness Benefits",
    items: [
      {
        emoji: "🌱",
        title: "Plant-based",
        desc: "100% plant-based alternative. Rich in essential nutrients for optimal health and wellness.",
      },
      {
        emoji: "🛡️",
        title: "Boosts immunity",
        desc: "Rich in antioxidants and essential nutrients. Daily wellness support for a stronger immune system.",
      },
    ],
  },
  "soy milk": {
    title: "Soy Milk",
    subtitle: "Health & Wellness Benefits",
    items: [
      {
        emoji: "💪",
        title: "High Protein",
        desc: "A great source of plant-based protein to keep you fueled throughout the day.",
      },
      {
        emoji: "❤️",
        title: "Heart Healthy",
        desc: "Low in saturated fat and zero cholesterol, supporting a healthy heart.",
      },
    ],
  },
};

export default function ProductDrawerContent({
  product,
  category,
  promotions,
  allProducts,
  onClose,
}: ProductDrawerContentProps) {
  const { addItem } = useCart();

  const config = category?.config ? JSON.parse(category.config) : {};
  const flow = config.flow || 'drink_full';

  // Dynamic Sizes Logic
  const definedSizes = config.sizes;
  const defaultSizes = [{name: 'small', price: 0}, {name: 'medium', price: 25}, {name: 'large', price: 50}];
  // Use defined sizes if array exists (even if empty, meaning NO sizes), else defaults
  const activeSizes = (definedSizes !== undefined && Array.isArray(definedSizes)) ? definedSizes : defaultSizes;
  const hasSizes = activeSizes.length > 0;

  // Identify if item is a snack
  const isSnack =
    category?.type === "snack" ||
    product.categoryType === "snack" ||
    category?.name?.toLowerCase() === "snacks";

  // Check if modifiers/toppings exist
  const hasModifiers = (product.modifiers || []).some((g: any) => g.displayMode !== "cards");
  const hasToppings = (product.modifiers || []).some((g: any) => g.displayMode === "cards");

  // Set initial step based on flow
  const initialStep = flow === "simple_choice" || flow === "fixed_meal"
      ? "dynamic_options"
      : "quantity";
      
  const [step, setStep] = useState<Step>(initialStep);
  // --- STATE ---
  const [quantity, setQuantity] = useState(1);
  const defaultSizeName = activeSizes.find((s: any) => s.name.toLowerCase() === 'medium')?.name || activeSizes[0]?.name || '';
  const [size, setSize] = useState(defaultSizeName);
  
  // Initialize selectedOptions with default modifier options
  const initialSelectedOptions: Record<string, string | string[]> = {};
  (product.modifiers || []).forEach((group: any) => {
    if (group.defaultModifierOptionId) {
      // Check if it's a multi-select (cards) or single-select
      if (group.displayMode === 'cards') {
        initialSelectedOptions[group.id] = [group.defaultModifierOptionId];
      } else {
        initialSelectedOptions[group.id] = group.defaultModifierOptionId;
      }
    }
  });
  
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string | string[]>
  >(initialSelectedOptions);

  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [activeInfoKey, setActiveInfoKey] = useState<string | null>(null);

  const handleInfoClick = (key: string) => {
    setActiveInfoKey(key);
    setInfoModalOpen(true);
  };

  // Pricing Logic
  const basePrice = product.price;
  const sizeObj = activeSizes.find((s: any) => s.name === size);
  const sizePrice = sizeObj ? parseFloat(sizeObj.price || 0) : 0;

  const modifiersPrice = (product.modifiers || []).reduce(
    (total: number, group: any) => {
      const selection = selectedOptions[group.id];
      if (!selection) return total;

      if (Array.isArray(selection)) {
        // Multi-select (Cards)
        return (
          total +
          selection.reduce((subTotal, optId) => {
            const opt = group.options.find((o: any) => o.id === optId);
            return subTotal + (opt ? parseFloat(opt.price || "0") : 0);
          }, 0)
        );
      } else {
        // Single-select
        const opt = group.options.find((o: any) => o.id === selection);
        return total + (opt ? parseFloat(opt.price || "0") : 0);
      }
    },
    0,
  );

  const currentPrice = basePrice + sizePrice + modifiersPrice;

  const handleOptionSelect = (
    groupId: string,
    optionId: string,
    mode: string,
  ) => {
    if (mode === "cards") {
      // Multi-select behavior for cards (Toppings)
      setSelectedOptions((prev) => {
        const current = (prev[groupId] as string[]) || [];
        const isSelected = current.includes(optionId);
        return {
          ...prev,
          [groupId]: isSelected
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      });
    } else {
      // Single-select behavior for list/buttons
      setSelectedOptions((prev) => ({
        ...prev,
        [groupId]: optionId,
      }));
    }
  };

  const handleAddToCart = (overrideExtras?: any[], overrideLabel?: string) => {
    // Construct readable options object
    const readableOptions: Record<string, any> = {};
    if (hasSizes) {
      readableOptions.Size = size;
    }

    (product.modifiers || []).forEach((group: any) => {
      const selection = selectedOptions[group.id];
      if (selection) {
        if (Array.isArray(selection)) {
          if (selection.length > 0) {
            const names = selection
              .map((id) => group.options.find((o: any) => o.id === id)?.name)
              .filter(Boolean);
            readableOptions[group.name] = names.join(", ");
          }
        } else {
          const name = group.options.find((o: any) => o.id === selection)?.name;
          if (name) readableOptions[group.name] = name;
        }
      }
    });

    addItem({
      productId: product.id,
      name: product.name,
      price: currentPrice,
      quantity: quantity,
      image: product.image,
      options: readableOptions,
      bundleLabel: overrideLabel,
      extras: overrideExtras,
    });

    onClose();
  };

  // ... (Promotions Logic unchanged) ...
  // [Placeholder for Promotion Logic reuse if needed, or I rely on what's outside this block if I didn't replace it]
  // Note: I am replacing a large block, so I need to check where I cut.
  // I replaced from line 30 to 620 roughly. I need to keep the promotion logic if it was in there.
  // Yes, lines 108-118 and 142-201 were Promotion Logic. I MUST include them.

  // --- Promotion Logic (Restored) ---
  const bundlePromo = promotions.find(
    (p) => p.type === "PERFECT_PAIR" && p.triggerValue === product.id,
  );
  const crossSellPromo = promotions.find(
    (p) => p.type === "CROSS_SELL" && p.triggerValue === product.categoryType,
  );

  const calculateDiscountedPrice = (item: any, promo: any) => {
    const price = parseFloat(item.price || item.basePrice || "0");
    if (promo.discountType === "PERCENTAGE") {
      return price * (1 - parseFloat(promo.discountValue) / 100);
    } else {
      return Math.max(0, price - parseFloat(promo.discountValue));
    }
  };

  const handleUpsellAndAdd = () => {
    if (!bundlePromo) return;
    const pairedProductId = bundlePromo.items[0]?.productId;
    const pairedProduct = allProducts.find((p) => p.id === pairedProductId);

    if (!pairedProduct) {
      handleAddToCart();
      return;
    }

    const discountedPrice = calculateDiscountedPrice(
      pairedProduct,
      bundlePromo,
    );
    const bundleItem = {
      productId: pairedProduct.id,
      name: pairedProduct.name,
      price: discountedPrice,
      quantity: 1,
      image: pairedProduct.image,
      options: {},
      tag: "TOGETHER",
    };

    handleAddToCart([bundleItem], bundlePromo.name || "Perfect Pair Bundle");
  };

  const handleAddWithExtras = () => {
    /* ... simplified for brevity, refer to original if complex logic needed, but I'll assume standard add */
    // Actually checking original lines 177-201.
    if (!crossSellPromo) {
      handleAddToCart();
      return;
    }
    const extrasToAdd = selectedExtras
      .map((id) => {
        const item = allProducts.find((i) => i.id === id);
        if (!item) return null;
        const discountedPrice = calculateDiscountedPrice(item, crossSellPromo);
        return {
          productId: item.id,
          name: item.name,
          price: discountedPrice,
          quantity: 1,
          image: item.image,
          options: {},
          tag: "TOGETHER",
        };
      })
      .filter(Boolean);
    handleAddToCart(extrasToAdd as any[]);
  };

  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  const handleQuantityContinue = () => {
    if (hasSizes) setStep("size");
    else if (hasModifiers) setStep("customization");
    else if (hasToppings) setStep("toppings");
    else if (bundlePromo) setStep("upsell");
    else if (crossSellPromo && crossSellPromo.items.length > 0) setStep("frequentlyBought");
    else handleAddToCart();
  };

  const handleUpsellSkip = () => {
    if (crossSellPromo && crossSellPromo.items.length > 0) setStep("frequentlyBought");
    else handleAddToCart();
  };

  // --- Helper to render Common Header Image ---
  const HeaderImage = ({ compact = false }: { compact?: boolean }) => (
    <div className={`relative w-full shrink-0 ${compact ? "h-40" : "h-64"}`}>
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/10 to-transparent z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent z-10" />
      <Image
        src={
          product.image ||
          "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1000&auto=format&fit=crop"
        }
        alt={product.name}
        fill
        className="object-cover"
      />
      <div className="absolute top-4 left-4 right-4 flex justify-between z-20">
        {step !== initialStep ? (
          <button
            onClick={() => {
              if (step === "size") {
                setStep("quantity");
              }
              if (step === "customization") {
                if (hasSizes) setStep("size");
                else setStep("quantity");
              }
              if (step === "toppings") {
                if (hasModifiers) setStep("customization");
                else if (hasSizes) setStep("size");
                else setStep("quantity");
              }
              if (step === "upsell") {
                if (hasToppings) setStep("toppings");
                else if (hasModifiers) setStep("customization");
                else if (hasSizes) setStep("size");
                else setStep("quantity");
              }
              if (step === "frequentlyBought") {
                if (bundlePromo) setStep("upsell");
                else if (hasToppings) setStep("toppings");
                else if (hasModifiers) setStep("customization");
                else if (hasSizes) setStep("size");
                else setStep("quantity");
              }
            }}
            className="bg-white p-2 rounded-lg shadow-sm text-gray-900 transition-transform active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={onClose}
          className="bg-white p-2 rounded-lg shadow-sm text-gray-900 transition-transform active:scale-95"
        >
          <X size={20} />
        </button>
      </div>
      <div className="absolute bottom-4 left-6 right-6 z-20">
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">
          {product.name}
        </h2>
      </div>
    </div>
  );

  const StickyFooter = ({
    label = "Continue",
    onClick,
  }: {
    label?: string;
    onClick?: () => void;
  }) => (
    <div className="p-4 bg-white border-t border-gray-100 mt-auto">
      <button
        onClick={onClick}
        className="w-full bg-[#D95D1E] text-white font-bold py-4 rounded-xl text-lg flex justify-between px-6 shadow-lg shadow-orange-200 hover:bg-[#c4531b] transition-colors border border-black"
      >
        <span>{label}</span>
        <span>₱{(currentPrice * quantity).toFixed(2)}</span>
      </button>
    </div>
  );

  // --- RENDERING ---

  if (step === "size") {
    return (
      <div className="flex flex-col h-full bg-white">
        <HeaderImage />
        <div className="p-6 flex-1 overflow-y-auto pt-2">
          <h3 className="font-semibold text-gray-900 mb-4 text-lg">
            Choose your size
          </h3>
          <div className="space-y-3">
            {activeSizes.map((s: any) => (
              <button
                key={s.name}
                onClick={() => setSize(s.name)}
                className={`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all ${size === s.name ? "bg-[#D95D1E] text-white border-black" : "border-transparent bg-gray-50 text-gray-600"}`}
              >
                <span className="capitalize font-medium text-lg">{s.name}</span>
                <span className="text-sm font-medium">
                  {parseFloat(s.price) === 0
                    ? "Base price"
                    : `+₱${parseFloat(s.price).toFixed(2)}`}
                </span>
              </button>
            ))}
          </div>
        </div>
        <StickyFooter onClick={() => {
          if (hasModifiers) {
            setStep("customization");
          } else if (hasToppings) {
            setStep("toppings");
          } else if (bundlePromo) {
            setStep("upsell");
          } else if (crossSellPromo && crossSellPromo.items.length > 0) {
            setStep("frequentlyBought");
          } else {
            handleAddToCart();
          }
        }} />
      </div>
    );
  }

  if (step === "quantity") {
    // Snack Quantity logic...
    return (
      <div className="flex flex-col h-full bg-white">
        <HeaderImage />
        <div className="p-6 flex-1 overflow-y-auto pt-2 flex flex-col items-center justify-center">
          <h3 className="font-semibold text-gray-900 mb-8 text-xl">
            How many would you like?
          </h3>
          <div className="flex items-center gap-8 mb-12">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
            >
              <Minus size={32} />
            </button>
            <span className="text-5xl font-bold text-gray-900 w-24 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-16 h-16 rounded-full bg-[#D95D1E] flex items-center justify-center text-white"
            >
              <Plus size={32} />
            </button>
          </div>
        </div>
        <StickyFooter onClick={handleQuantityContinue} />
      </div>
    );
  }

  if (step === "customization") {
    // Skip this step if no modifiers exist
    if (!hasModifiers) {
      if (hasToppings) {
        setStep("toppings");
      } else if (bundlePromo) {
        setStep("upsell");
      } else if (crossSellPromo && crossSellPromo.items.length > 0) {
        setStep("frequentlyBought");
      } else {
        handleAddToCart();
      }
      return null;
    }

    return (
      <div className="flex flex-col h-full bg-white">
        <HeaderImage compact />
        <div className="p-6 flex-1 overflow-y-auto pb-32">
          <div className="flex items-center gap-2 mb-6">
            <img
              src="/icons/magic-stick-3-svgrepo-com.svg"
              alt="Magic"
              className="w-5 h-5 filter-nav-orange"
              style={{
                filter:
                  "invert(48%) sepia(68%) saturate(3474%) hue-rotate(346deg) brightness(93%) contrast(92%)",
              }}
            />
            <span className="text-black font-bold text-sm">Make it yours</span>
          </div>

          {(product.modifiers || []).filter((g: any) => g.displayMode !== "cards").length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No options available for this item.
            </div>
          ) : (
            (product.modifiers || [])
              .filter((g: any) => g.displayMode !== "cards")
              .map((group: any) => (
                <div key={group.id} className="mb-8 last:mb-0">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    {group.name}
                  </h3>

                  {/* BUTTONS MODE (e.g. Sweetness / Ice) */}
                  {group.displayMode === "buttons" && (
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((opt: any) => {
                        const isSelected = selectedOptions[group.id] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() =>
                              handleOptionSelect(group.id, opt.id, "buttons")
                            }
                            className={`px-4 py-3 rounded-xl text-sm font-bold border transition-colors flex-1 min-w-[80px] ${isSelected ? "bg-[#D95D1E] text-white border-black" : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50"}`}
                          >
                            {opt.name}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* LIST MODE (e.g. Milk) */}
                  {group.displayMode === "list" && (
                    <div className="space-y-3">
                      {group.options.map((opt: any) => {
                        const isSelected = selectedOptions[group.id] === opt.id;
                        const infoKey = opt.name.toLowerCase();
                        const hasInfo = MODIFIER_INFO[infoKey];

                        return (
                          <div
                            key={opt.id}
                            className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl border transition-all ${isSelected ? "bg-[#D95D1E] border-black" : "border-gray-100"}`}
                          >
                            {hasInfo && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInfoClick(infoKey);
                                }}
                                className="p-2 shrink-0 relative z-20 opacity-80 hover:opacity-100 transition-opacity"
                              >
                                <img
                                  src="/icons/info-circle-svgrepo-com.svg"
                                  alt="Info"
                                  className={`w-5 h-5 block ${isSelected ? "brightness-0 invert" : ""}`}
                                />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedOptions({
                                  ...selectedOptions,
                                  [group.id]: opt.id,
                                });
                              }}
                              className="flex-1 flex justify-between items-center py-1 pr-2 cursor-pointer"
                            >
                              <span
                                className={`font-medium ${isSelected ? "text-white" : "text-gray-600"}`}
                              >
                                {opt.name}
                              </span>
                              {parseFloat(opt.price || "0") > 0 && (
                                <span
                                  className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-500"}`}
                                >
                                  +₱{opt.price}
                                </span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
        <StickyFooter onClick={() => {
          if (hasToppings) {
            setStep("toppings");
          } else if (bundlePromo) {
            setStep("upsell");
          } else if (crossSellPromo && crossSellPromo.items.length > 0) {
            setStep("frequentlyBought");
          } else {
            handleAddToCart();
          }
        }} />
        {activeInfoKey && MODIFIER_INFO[activeInfoKey] && (
          <InfoPopup
            isOpen={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title={MODIFIER_INFO[activeInfoKey].title}
            subtitle={MODIFIER_INFO[activeInfoKey].subtitle}
          >
            {MODIFIER_INFO[activeInfoKey].items.map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="shrink-0 text-2xl">{item.emoji}</div>
                <div>
                  <h4 className="font-bold text-gray-900 leading-none mb-1">
                    {item.title}
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </InfoPopup>
        )}
      </div>
    );
  }

  // --- STEP: TOPPINGS ---
  if (step === "toppings") {
    // Skip this step if no toppings exist
    if (!hasToppings) {
      if (bundlePromo) {
        setStep("upsell");
      } else if (crossSellPromo && crossSellPromo.items.length > 0) {
        setStep("frequentlyBought");
      } else {
        handleAddToCart();
      }
      return null;
    }

    const toppingsGroups = (product.modifiers || []).filter(
      (g: any) => g.displayMode === "cards",
    );

    return (
      <div className="flex flex-col h-full bg-white">
        <HeaderImage compact />
        <div className="p-6 flex-1 overflow-y-auto pb-32">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">✨</span>
            <span className="text-black font-bold text-sm">Add Toppings</span>
          </div>

          {toppingsGroups.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No toppings available for this item.
            </div>
          ) : (
            toppingsGroups.map((group: any) => (
              <div key={group.id} className="mb-8 last:mb-0">
                <h3 className="font-semibold text-gray-900 mb-4">
                  {group.name}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {group.options.map((opt: any) => {
                    const current =
                      (selectedOptions[group.id] as string[]) || [];
                    const isSelected = current.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() =>
                          handleOptionSelect(group.id, opt.id, "cards")
                        }
                        className={`relative group rounded-xl overflow-hidden border-2 text-left transition-all ${isSelected ? "border-black shadow-md" : "border-gray-100 hover:border-gray-200"}`}
                      >
                        <div className="aspect-square relative w-full h-32 bg-gray-100">
                          {opt.image ? (
                            <Image
                              src={opt.image}
                              alt={opt.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <span className="text-2xl">✨</span>
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute inset-0 bg-[#D95D1E]/20 flex items-center justify-center">
                              <div className="bg-white rounded-full p-1 shadow-sm">
                                <Check
                                  size={16}
                                  className="text-[#D95D1E]"
                                  strokeWidth={3}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-3 bg-white">
                          <h4 className="font-bold text-gray-900 text-sm leading-tight mb-1">
                            {opt.name}
                          </h4>
                          {parseFloat(opt.price || "0") > 0 && (
                            <span className="text-xs text-gray-500 font-medium">
                              +₱{opt.price}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
        <StickyFooter
          onClick={() => {
            if (bundlePromo) {
              setStep("upsell");
            } else if (crossSellPromo && crossSellPromo.items.length > 0) {
              setStep("frequentlyBought");
            } else {
              handleAddToCart();
            }
          }}
        />
      </div>
    );
  }

  // --- STEP: UPSELL (Perfect Pair) ---
  if (step === "upsell") {
    const pairedProductId = bundlePromo?.items[0]?.productId;
    const pairedProduct = allProducts.find((p) => p.id === pairedProductId);
    const discountedPrice = pairedProduct
      ? calculateDiscountedPrice(pairedProduct, bundlePromo)
      : 0;

    if (!pairedProduct) {
      // Fallback if product not found
      if (crossSellPromo && crossSellPromo.items.length > 0) {
        setStep("frequentlyBought");
      } else {
        handleAddToCart();
      }
      return null; // or render nothing while switching
    }

    return (
      <div className="flex flex-col h-full bg-white relative">
        <div className="flex-1 bg-gray-50 flex flex-col items-center">
          {/* Top Controls */}
          <div className="w-full p-4 flex justify-between items-center z-10">
            <button
              onClick={() => setStep(isSnack ? "quantity" : "toppings")}
              className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <button
              onClick={handleUpsellSkip}
              className="text-gray-400 font-medium hover:text-gray-600"
            >
              Skip
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-6 w-full max-w-sm">
            <div className="bg-white rounded-[2rem] shadow-xl w-full overflow-hidden flex flex-col transform transition-all hover:scale-105 duration-300">
              <div className="relative h-56 w-full flex">
                {/* Badge */}
                <div className="absolute top-4 left-4 z-20 bg-[#D95D1E] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                  <Check size={12} strokeWidth={4} />
                  Best Value
                </div>

                {/* Image 1 - Main Product */}
                <div className="relative w-1/2 h-full border-r border-white/20">
                  <Image
                    src={
                      product.image ||
                      "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1000&auto=format&fit=crop"
                    }
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Image 2 - Upsell Product */}
                <div className="relative w-1/2 h-full">
                  <Image
                    src={
                      pairedProduct.image ||
                      "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1000&auto=format&fit=crop"
                    }
                    alt={pairedProduct.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2">
                  {product.name} + {pairedProduct.name}
                </h3>
                <div className="text-[#D95D1E] font-medium flex items-center justify-center gap-2">
                  <span>
                    Only ₱{discountedPrice.toFixed(2)} more – make it a meal!
                  </span>
                  <span className="text-lg">🔥</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-gray-100 mt-auto shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20">
          <button
            onClick={handleUpsellAndAdd}
            className="w-full bg-[#D95D1E] text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 hover:bg-[#bf4f18] transition-all active:scale-95 text-lg"
          >
            Yes, Perfect!
          </button>
        </div>
      </div>
    );
  }

  // --- STEP 5: FREQUENTLY BOUGHT ---
  if (step === "frequentlyBought") {
    const isDynamic = crossSellPromo && crossSellPromo.items.length > 0;

    let items: any[] = [];

    if (isDynamic) {
      items = crossSellPromo.items
        .map((li: any) => allProducts.find((p: any) => p.id === li.productId))
        .filter(Boolean);
    } else {
      // Fallback to static (restoring HEAD feature)
      items = [
        {
          id: "taro-milk-tea",
          name: "Taro Milk Tea",
          price: 120,
          originalPrice: 150,
          image:
            "https://images.unsplash.com/photo-1541658016709-82535e94bc69?q=80&w=400&fit=crop",
          isPopular: true,
        },
        {
          id: "bottled-water",
          name: "Bottled Water",
          price: 40,
          originalPrice: 50,
          image:
            "https://images.unsplash.com/photo-1563806950-c8f77341fc68?q=80&w=400&fit=crop",
        },
      ];
    }

    const toggleExtra = (id: string) => {
      setSelectedExtras((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
      );
    };

    const extrasTotal = selectedExtras.reduce((total, id) => {
      const item = items.find((i: any) => i.id === id);
      if (!item) return total;

      if (isDynamic) {
        return total + calculateDiscountedPrice(item, crossSellPromo);
      } else {
        return total + item.price;
      }
    }, 0);

    const finalTotalPrice =
      (isSnack ? currentPrice * quantity : currentPrice) + extrasTotal;

    return (
      <div className="flex flex-col h-full bg-white">
        <div className="p-4 bg-white relative border-b border-gray-50">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() =>
                bundlePromo
                  ? setStep("upsell")
                  : setStep(isSnack ? "quantity" : "toppings")
              }
              className="text-gray-500 hover:text-gray-900 p-2"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={() => handleAddToCart()}
              className="text-gray-400 font-medium text-sm px-2"
            >
              Skip
            </button>
          </div>
          <div className="px-2">
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              Frequently bought together
            </h2>
            <p className="text-[#D95D1E] text-xs font-bold mt-1 uppercase tracking-wider">
              {isDynamic
                ? crossSellPromo.discountType === "PERCENTAGE"
                  ? `Save ${crossSellPromo.discountValue}% on each items`
                  : `₱${crossSellPromo.discountValue} OFF on each items`
                : "Save 20% on each item"}
            </p>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            {items.map((item: any) => {
              const isSelected = selectedExtras.includes(item.id);
              const price = isDynamic
                ? parseFloat(item.price || item.basePrice || "0")
                : item.originalPrice;
              const discounted = isDynamic
                ? calculateDiscountedPrice(item, crossSellPromo)
                : item.price;

              return (
                <button
                  key={item.id}
                  onClick={() => toggleExtra(item.id)}
                  className={`bg-white rounded-2xl p-3 shadow-sm border text-left flex flex-col h-full transition-all ${
                    isSelected
                      ? "border-[#D95D1E] ring-1 ring-[#D95D1E] bg-orange-50/10"
                      : "border-gray-100"
                  }`}
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-gray-100 w-full">
                    <Image
                      src={
                        item.image ||
                        "https://images.unsplash.com/photo-1541658016709-82535e94bc69?q=80&w=400&fit=crop"
                      }
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                        <div className="bg-[#D95D1E] text-white rounded-full p-1.5 shadow-sm">
                          <Check size={16} strokeWidth={3} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col w-full">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">
                      {item.name}
                    </h3>
                    {!isDynamic && item.isPopular && (
                      <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-md self-start mb-2">
                        Popular
                      </span>
                    )}
                    <div className="mt-auto">
                      <span className="text-xs text-gray-400 line-through mr-2">
                        ₱{price.toFixed(2)}
                      </span>
                      <span className="text-[#D95D1E] font-bold text-lg">
                        ₱{discounted.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-white border-t border-gray-100 mt-auto">
          <button
            onClick={handleAddWithExtras}
            className="w-full bg-[#D95D1E] text-white font-bold py-4 rounded-xl text-lg flex justify-between px-6 shadow-lg shadow-orange-200 hover:bg-[#c4531b] transition-colors border border-black"
          >
            <span>
              {selectedExtras.length > 0 ? "Add with deals" : "Add to Cart"}
            </span>
            <span>₱{finalTotalPrice.toFixed(2)}</span>
          </button>
        </div>
      </div>
    );
  }

  // --- STEP: DYNAMIC OPTIONS (New) ---
  if (step === "dynamic_options") {
    return (
      <div className="flex flex-col h-full bg-white">
        <HeaderImage />
        <div className="p-6 flex-1 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-4 text-lg">
            Customize your order
          </h3>
          <div className="space-y-8">
            {(product.modifiers || []).map((group: any) => (
              <div key={group.id} className="space-y-4">
                <label className="block text-sm font-bold uppercase tracking-widest text-gray-400">
                  {group.name}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {group.options.map((opt: any) => (
                    <button
                      key={opt.id}
                      className="w-full flex justify-between items-center p-4 rounded-xl border-2 border-gray-100 bg-gray-50 text-gray-600 hover:border-[#D95D1E]/30 transition-all font-medium"
                    >
                      <span className="capitalize">{opt.name}</span>
                      {opt.price > 0 && (
                        <span className="text-sm font-bold text-[#D95D1E]">
                          ₱{opt.price}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {product.modifiers?.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check size={20} className="text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm">
                  No extra customizations for this item.
                </p>
              </div>
            )}
          </div>
        </div>
        <StickyFooter label="Add to Cart" onClick={() => handleAddToCart()} />
      </div>
    );
  }

  return null;
}
