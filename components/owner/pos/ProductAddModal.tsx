'use client';

import { useState, useMemo, useEffect } from 'react';
import { X, Minus, Plus, ArrowLeft } from 'lucide-react';

export type ModifierGroup = {
  id: string;
  name: string;
  displayMode: string;
  defaultModifierOptionId?: string | null;
  options: { id: string; name: string; price: number; image?: string | null }[];
};

export type ProductForModal = {
  id: string;
  name: string;
  basePrice: string | number;
  imageUrl?: string | null;
  modifiers?: ModifierGroup[];
};

type Step = 'size' | 'customization' | 'toppings' | 'quantity';

type CartItemPayload = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  options?: Record<string, unknown>;
  extras?: { productId: string; name: string; price: number; quantity: number; options?: Record<string, unknown>; tag?: string }[];
  bundleLabel?: string;
  tag?: string;
};

function optionIdsFromReadable(
  sortedModifiers: ModifierGroup[],
  readable: Record<string, unknown> | undefined
): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  sortedModifiers.forEach((group) => {
    if (group.defaultModifierOptionId) {
      if (group.displayMode === 'cards') {
        result[group.id] = [group.defaultModifierOptionId];
      } else {
        result[group.id] = group.defaultModifierOptionId;
      }
    }
  });
  if (!readable || typeof readable !== 'object') return result;
  const rawIds = readable.__optionIds;
  if (Array.isArray(rawIds) && rawIds.length > 0) {
    const idSet = new Set(rawIds.filter((x): x is string => typeof x === 'string' && x.length > 0));
    sortedModifiers.forEach((group) => {
      if (group.displayMode === 'cards') {
        const ids = group.options.map((o) => o.id).filter((id) => idSet.has(id));
        if (ids.length) result[group.id] = ids;
      } else {
        const found = group.options.find((o) => idSet.has(o.id));
        if (found) result[group.id] = found.id;
      }
    });
    return result;
  }
  sortedModifiers.forEach((group) => {
    const val = readable[group.name];
    if (val == null) return;
    const str = String(val).trim();
    if (!str) return;
    if (group.displayMode === 'cards') {
      const names = str.split(',').map((s) => s.trim()).filter(Boolean);
      const ids = names
        .map((name) => group.options.find((o) => o.name.trim().toLowerCase() === name.toLowerCase())?.id)
        .filter(Boolean) as string[];
      if (ids.length) result[group.id] = ids;
    } else {
      const opt = group.options.find((o) => o.name.trim().toLowerCase() === str.toLowerCase());
      if (opt) result[group.id] = opt.id;
    }
  });
  return result;
}

export function ProductAddModal({
  product,
  categoryName,
  onAdd,
  onClose,
  resolveImageUrl,
  formatCurrency,
  initialOptionsFromCart,
  initialQuantity,
  editMode,
}: {
  product: ProductForModal;
  categoryName?: string;
  onAdd: (item: CartItemPayload) => void;
  onClose: () => void;
  resolveImageUrl: (url: string | null | undefined) => string | null;
  formatCurrency: (n: number) => string;
  initialOptionsFromCart?: Record<string, unknown>;
  initialQuantity?: number;
  editMode?: boolean;
}) {
  const sortedModifiers = useMemo(() => {
    const list = [...(product.modifiers || [])];
    return list.sort((a, b) => {
      if (a.name?.toLowerCase() === 'size') return -1;
      if (b.name?.toLowerCase() === 'size') return 1;
      return 0;
    });
  }, [product.modifiers]);

  const hasSize = sortedModifiers.some((g) => g.name?.toLowerCase() === 'size');
  const hasModifiers = sortedModifiers.some((g) => g.displayMode !== 'cards' && g.name?.toLowerCase() !== 'size');
  const hasToppings = sortedModifiers.some((g) => g.displayMode === 'cards');

  const initialStep: Step = hasSize ? 'size' : hasModifiers ? 'customization' : hasToppings ? 'toppings' : 'quantity';

  const computedInitialSelectedOptions = useMemo(
    () => optionIdsFromReadable(sortedModifiers, initialOptionsFromCart),
    [sortedModifiers, initialOptionsFromCart]
  );

  const [step, setStep] = useState<Step>(initialStep);
  const [quantity, setQuantity] = useState(initialQuantity ?? 1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | string[]>>(computedInitialSelectedOptions);

  useEffect(() => {
    setSelectedOptions(computedInitialSelectedOptions);
    setQuantity(initialQuantity ?? 1);
  }, [product.id, computedInitialSelectedOptions, initialQuantity]);

  const basePrice = parseFloat(String(product.basePrice ?? 0));
  const modifiersPrice = useMemo(() => {
    return sortedModifiers.reduce((total, group) => {
      const selection = selectedOptions[group.id];
      if (!selection) return total;
      if (Array.isArray(selection)) {
        return total + selection.reduce((sum, optId) => {
          const opt = group.options.find((o) => o.id === optId);
          return sum + (opt ? opt.price : 0);
        }, 0);
      }
      const opt = group.options.find((o) => o.id === selection);
      return total + (opt ? opt.price : 0);
    }, 0);
  }, [sortedModifiers, selectedOptions]);

  const currentPrice = basePrice + modifiersPrice;

  const handleOptionSelect = (groupId: string, optionId: string, mode: string) => {
    if (mode === 'cards') {
      setSelectedOptions((prev) => {
        const current = (prev[groupId] as string[]) || [];
        const isSelected = current.includes(optionId);
        return {
          ...prev,
          [groupId]: isSelected ? current.filter((id) => id !== optionId) : [...current, optionId],
        };
      });
    } else {
      setSelectedOptions((prev) => ({ ...prev, [groupId]: optionId }));
    }
  };

  const handleAdd = () => {
    const readableOptions: Record<string, unknown> = {};
    const optionIdsForInventory: string[] = [];
    sortedModifiers.forEach((group) => {
      const selection = selectedOptions[group.id];
      if (selection) {
        if (Array.isArray(selection)) {
          if (selection.length > 0) {
            const names = selection
              .map((id) => group.options.find((o) => o.id === id)?.name)
              .filter(Boolean);
            readableOptions[group.name] = names.join(', ');
            optionIdsForInventory.push(...selection);
          }
        } else {
          const name = group.options.find((o) => o.id === selection)?.name;
          if (name) readableOptions[group.name] = name;
          optionIdsForInventory.push(selection);
        }
      }
    });
    if (optionIdsForInventory.length > 0) {
      readableOptions.__optionIds = optionIdsForInventory;
    }

    onAdd({
      productId: product.id,
      name: product.name,
      price: currentPrice,
      quantity,
      options: Object.keys(readableOptions).length ? readableOptions : undefined,
    });
    onClose();
  };

  const goBack = () => {
    if (step === 'customization') setStep('size');
    else if (step === 'toppings') setStep(hasModifiers ? 'customization' : 'size');
    else if (step === 'quantity') setStep(hasToppings ? 'toppings' : hasModifiers ? 'customization' : 'size');
  };

  const canGoBack = step !== 'size' && step !== (hasSize ? 'size' : hasModifiers ? 'customization' : hasToppings ? 'toppings' : 'quantity');

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden flex-1 sm:flex-initial">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {canGoBack && (
              <button type="button" onClick={goBack} className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100">
                <ArrowLeft size={20} />
              </button>
            )}
            <h3 className="font-bold text-gray-900 truncate">{product.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {step === 'size' && hasSize && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Size</h4>
              <div className="flex flex-wrap gap-2">
                {sortedModifiers
                  .filter((g) => g.name?.toLowerCase() === 'size')
                  .flatMap((g) => g.options)
                  .map((opt) => {
                    const group = sortedModifiers.find((x) => x.options.some((o) => o.id === opt.id));
                    const groupId = group?.id ?? '';
                    const isSelected = selectedOptions[groupId] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleOptionSelect(groupId, opt.id, group?.displayMode ?? 'list')}
                        className={`px-4 py-2.5 rounded-xl border-2 font-medium transition-colors min-h-[44px] ${
                          isSelected ? 'border-[#D95D1E] bg-orange-50 text-[#D95D1E]' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {opt.name} {opt.price > 0 ? `+${formatCurrency(opt.price)}` : ''}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {step === 'customization' && hasModifiers && (
            <div className="space-y-4">
              {sortedModifiers
                .filter((g) => g.displayMode !== 'cards' && g.name?.toLowerCase() !== 'size')
                .map((group) => (
                  <div key={group.id}>
                    <h4 className="font-semibold text-gray-900 mb-2">{group.name}</h4>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((opt) => {
                        const isSelected = selectedOptions[group.id] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleOptionSelect(group.id, opt.id, group.displayMode)}
                            className={`px-4 py-2.5 rounded-xl border-2 font-medium transition-colors min-h-[44px] ${
                              isSelected ? 'border-[#D95D1E] bg-orange-50 text-[#D95D1E]' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {opt.name} {opt.price > 0 ? `+${formatCurrency(opt.price)}` : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {step === 'toppings' && hasToppings && (
            <div className="space-y-4">
              {sortedModifiers
                .filter((g) => g.displayMode === 'cards')
                .map((group) => (
                  <div key={group.id}>
                    <h4 className="font-semibold text-gray-900 mb-2">{group.name}</h4>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((opt) => {
                        const current = (selectedOptions[group.id] as string[]) || [];
                        const isSelected = current.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleOptionSelect(group.id, opt.id, 'cards')}
                            className={`px-4 py-2.5 rounded-xl border-2 font-medium transition-colors min-h-[44px] ${
                              isSelected ? 'border-[#D95D1E] bg-orange-50 text-[#D95D1E]' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {opt.name} {opt.price > 0 ? `+${formatCurrency(opt.price)}` : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {step === 'quantity' && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Quantity</h4>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-gray-200 font-bold text-gray-700 hover:border-[#D95D1E] hover:text-[#D95D1E]"
                >
                  <Minus size={18} />
                </button>
                <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-gray-200 font-bold text-gray-700 hover:border-[#D95D1E] hover:text-[#D95D1E]"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50/50 shrink-0 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Total</span>
            <span className="text-xl font-bold text-[#D95D1E]">{formatCurrency(currentPrice * quantity)}</span>
          </div>
          {step === 'quantity' ? (
            <button
              type="button"
              onClick={handleAdd}
              className="w-full py-3.5 bg-[#D95D1E] hover:bg-[#c25016] text-white font-bold rounded-xl transition-colors"
            >
              {editMode ? 'Update item' : 'Add to order'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (step === 'size') setStep(hasModifiers ? 'customization' : hasToppings ? 'toppings' : 'quantity');
                else if (step === 'customization') setStep(hasToppings ? 'toppings' : 'quantity');
                else if (step === 'toppings') setStep('quantity');
              }}
              className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
