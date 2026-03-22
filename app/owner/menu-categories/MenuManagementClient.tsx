"use client";

import { useState, useRef, useEffect, type Dispatch, type SetStateAction } from "react";
import React from "react";
import Image from "next/image";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Settings2,
  X,
  Trash,
  Droplet,
  MoreVertical,
  HelpCircle,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  createModifierGroup,
  updateModifierGroup,
  deleteModifierGroup,
  updateCategoryOrder,
  updateProductOrder,
} from "@/app/actions/menu-management";
import {
  InventoryItem,
  linkProductToIngredientsAction,
} from "@/app/actions/inventory";
import { AlertModal } from "@/components/ui/AlertModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { resolveProductMenuPrice } from "@/lib/product-sale-price";

type Product = {
  id: string;
  name: string;
  basePrice: string;
  imageUrl: string | null;
  categoryId: string;
  isHidden?: boolean;
  isFeatured?: boolean;
  isQuickCartItem?: boolean;
  saleDiscountType?: "PERCENTAGE" | "FIXED" | null;
  saleDiscountValue?: string | null;
  saleLabel?: string | null;
  modifierLinks?: {
    modifierGroupId: string;
    defaultModifierOptionId?: string | null;
  }[];
  productIngredients?: { inventoryItemId: string; quantityRequired: string }[];
};

type Category = {
  id: string;
  name: string;
  type: string;
  config?: string | null;
  products: Product[];
};

type ModifierGroup = {
  id: string;
  name: string;
  displayMode: "list" | "buttons" | "cards";
  defaultOptionId?: string | null;
  options: {
    id: string;
    name: string;
    price: string;
    imageUrl?: string | null;
  }[];
};

interface Props {
  initialCategories: Category[];
  modifierGroups: ModifierGroup[];
  inventoryItems: InventoryItem[];
  branchId: string;
}

type SortableProductRowProps = {
  product: Product;
  category: Category;
  mobileActionsProductId: string | null;
  setMobileActionsProductId: Dispatch<SetStateAction<string | null>>;
  mobileActionsRowRef: React.RefObject<HTMLDivElement | null>;
  openProductModal: (product: Product | null, categoryId: string | null) => void;
  handleDeleteProduct: (id: string) => void;
};

function SortableProductRow({
  product,
  category,
  mobileActionsProductId,
  setMobileActionsProductId,
  mobileActionsRowRef,
  openProductModal,
  handleDeleteProduct,
}: SortableProductRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (mobileActionsProductId === product.id) {
          mobileActionsRowRef.current = node;
        } else if (mobileActionsRowRef.current === node) {
          mobileActionsRowRef.current = null;
        }
      }}
      style={style}
      className="product-row p-4 pl-2 md:pl-6 flex items-center justify-between gap-3 hover:bg-white transition-colors group"
    >
      <button
        type="button"
        className="touch-none p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing shrink-0 rounded-lg hover:bg-gray-100"
        aria-label="Reorder product"
        {...attributes}
        {...listeners}
        onPointerDown={(e) => {
          (
            listeners as {
              onPointerDown?: (ev: React.PointerEvent<HTMLButtonElement>) => void;
            }
          )?.onPointerDown?.(e);
          e.stopPropagation();
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={18} />
      </button>
      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
        <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm transition-transform group-hover:scale-105">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <ImageIcon size={24} className="text-gray-300" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-gray-900 truncate">{product.name}</h4>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
            <p className="text-sm text-[#D95D1E] font-bold">
              ₱{product.basePrice}
            </p>
            {product.modifierLinks && product.modifierLinks.length > 0 && (
              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter">
                {product.modifierLinks.length} Modifiers
              </span>
            )}
            {product.isHidden && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter">
                Hidden
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          aria-label="Product actions"
          className={`md:hidden p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors ${mobileActionsProductId === product.id ? "hidden" : ""}`}
          onClick={() =>
            setMobileActionsProductId((prev) =>
              prev === product.id ? null : product.id,
            )
          }
        >
          <MoreVertical size={18} />
        </button>
        <div
          className={`flex items-center gap-1 transition-all md:translate-x-2 md:group-hover:translate-x-0 ${
            mobileActionsProductId === product.id
              ? "flex"
              : "hidden"
          } md:flex opacity-100 md:opacity-0 md:group-hover:opacity-100`}
        >
          <button
            type="button"
            onClick={() => {
              setMobileActionsProductId(null);
              openProductModal(product, category.id);
            }}
            className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            title="Edit product"
          >
            <Edit2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileActionsProductId(null);
              handleDeleteProduct(product.id);
            }}
            className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            title="Delete product"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

type ProductSortableListProps = {
  category: Category;
  setCategories: Dispatch<SetStateAction<Category[]>>;
  mobileActionsProductId: string | null;
  setMobileActionsProductId: Dispatch<SetStateAction<string | null>>;
  mobileActionsRowRef: React.RefObject<HTMLDivElement | null>;
  openProductModal: (product: Product | null, categoryId: string | null) => void;
  handleDeleteProduct: (id: string) => void;
};

function ProductSortableList({
  category,
  setCategories,
  mobileActionsProductId,
  setMobileActionsProductId,
  mobileActionsRowRef,
  openProductModal,
  handleDeleteProduct,
}: ProductSortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setCategories((cats) => {
      const cat = cats.find((c) => c.id === category.id);
      if (!cat) return cats;
      const oldIndex = cat.products.findIndex((p) => p.id === active.id);
      const newIndex = cat.products.findIndex((p) => p.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return cats;
      const nextProducts = arrayMove(cat.products, oldIndex, newIndex);
      const ids = nextProducts.map((p) => p.id);
      void updateProductOrder(ids).catch(() =>
        toast.error("Failed to save order"),
      );
      return cats.map((c) =>
        c.id === category.id ? { ...c, products: nextProducts } : c,
      );
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      id={`${category.id}-product-sort`}
    >
      <SortableContext
        items={category.products.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="divide-y divide-gray-100">
          {category.products.map((product) => (
            <SortableProductRow
              key={product.id}
              product={product}
              category={category}
              mobileActionsProductId={mobileActionsProductId}
              setMobileActionsProductId={setMobileActionsProductId}
              mobileActionsRowRef={mobileActionsRowRef}
              openProductModal={openProductModal}
              handleDeleteProduct={handleDeleteProduct}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

type SortableCategoryCardProps = {
  category: Category;
  expanded: boolean;
  onToggle: () => void;
  onAddProduct: () => void;
  onEditCategory: () => void;
  onDeleteCategory: () => void;
  setCategories: Dispatch<SetStateAction<Category[]>>;
  mobileActionsProductId: string | null;
  setMobileActionsProductId: Dispatch<SetStateAction<string | null>>;
  mobileActionsRowRef: React.RefObject<HTMLDivElement | null>;
  openProductModal: (product: Product | null, categoryId: string | null) => void;
  handleDeleteProduct: (id: string) => void;
};

function SortableCategoryCard({
  category,
  expanded,
  onToggle,
  onAddProduct,
  onEditCategory,
  onDeleteCategory,
  setCategories,
  mobileActionsProductId,
  setMobileActionsProductId,
  mobileActionsRowRef,
  openProductModal,
  handleDeleteProduct,
}: SortableCategoryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm transition-all hover:shadow-md"
    >
      <div
        className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
          <button
            type="button"
            className="touch-none p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing shrink-0 rounded-lg hover:bg-gray-100"
            aria-label="Reorder category"
            {...attributes}
            {...listeners}
            onPointerDown={(e) => {
              (
                listeners as {
                  onPointerDown?: (ev: React.PointerEvent<HTMLButtonElement>) => void;
                }
              )?.onPointerDown?.(e);
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={20} />
          </button>
          <div
            className={`p-1 rounded-md transition-transform shrink-0 ${expanded ? "rotate-0" : "-rotate-90"}`}
          >
            <ChevronDown size={20} className="text-gray-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-lg truncate">
              {category.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 border border-gray-200 px-1.5 rounded">
                {category.type}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500 font-medium">
                {category.products.length} products
              </span>
            </div>
          </div>
        </div>
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onAddProduct}
            className="p-2.5 text-gray-500 hover:text-[#D95D1E] hover:bg-orange-50 rounded-xl transition-all"
            title="Add Product"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={onEditCategory}
            className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={onDeleteCategory}
            className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="bg-gray-50/30 border-t border-gray-100">
          {category.products.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-400 italic text-sm mb-4">
                No products in this category yet.
              </p>
              <button
                onClick={onAddProduct}
                className="inline-flex items-center gap-2 text-[#D95D1E] font-medium hover:underline text-sm"
              >
                <Plus size={16} />
                Create your first product
              </button>
            </div>
          ) : (
            <ProductSortableList
              category={category}
              setCategories={setCategories}
              mobileActionsProductId={mobileActionsProductId}
              setMobileActionsProductId={setMobileActionsProductId}
              mobileActionsRowRef={mobileActionsRowRef}
              openProductModal={openProductModal}
              handleDeleteProduct={handleDeleteProduct}
            />
          )}
        </div>
      )}
    </div>
  );
}

const GoogleDriveImageGuide = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="inline-flex items-center justify-center ml-2 text-[#D95D1E] hover:text-[#bf4f18] transition-colors bg-orange-50 p-1 rounded-full align-middle normal-case"
        title="Google Drive Link Guide"
      >
        <HelpCircle size={14} />
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 normal-case">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div className="relative w-full max-w-sm bg-gray-900 text-white text-xs rounded-2xl shadow-2xl p-6 border border-gray-700/50 animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
              <X size={16} />
            </button>
            <h4 className="font-bold text-base mb-4 text-[#D95D1E] flex items-center gap-2">
              <ImageIcon size={18} /> Google Drive Links
            </h4>
            <ol className="list-decimal list-outside ml-4 space-y-4 font-medium text-gray-300">
              <li>
                <span className="text-white text-[13px]">Copy the File ID</span>
                <br />
                In a Google Drive link, the ID is the long string of letters and
                numbers:
                <br />
                <div className="bg-black/50 p-2.5 rounded-lg mt-1.5 font-mono text-[10px] break-all border border-gray-700 tracking-tighter leading-snug">
                  drive.google.com/file/d/
                  <span className="text-white bg-gray-600 px-1 py-0.5 rounded">
                    1A2b3C...
                  </span>
                  /view
                </div>
              </li>
              <li>
                <span className="text-white text-[13px]">
                  Create the Direct Link
                </span>
                <br />
                Paste that ID at the very end of this format:
                <br />
                <div className="bg-black/50 p-2.5 rounded-lg mt-1.5 font-mono text-[10px] border border-gray-700 tracking-tighter leading-snug break-all text-blue-300">
                  https://drive.google.com/uc?export=view&amp;id=
                  <span className="text-white bg-gray-600 px-1 py-0.5 rounded">
                    1A2b3C...
                  </span>
                </div>
              </li>
              <li>Use that final link in the Image URL field!</li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
};

export default function MenuManagementClient({
  initialCategories,
  modifierGroups,
  inventoryItems,
  branchId,
}: Props) {
  const [activeTab, setActiveTab] = useState<"menu" | "modifiers" | "toppings">(
    "menu",
  );
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    initialCategories.map((c) => c.id),
  );

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const categorySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setCategories((items) => {
      const oldIndex = items.findIndex((c) => c.id === active.id);
      const newIndex = items.findIndex((c) => c.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return items;
      const next = arrayMove(items, oldIndex, newIndex);
      const ids = next.map((c) => c.id);
      void updateCategoryOrder(ids).catch(() =>
        toast.error("Failed to save order"),
      );
      return next;
    });
  };

  // Find water product on mount
  React.useEffect(() => {
    const findWaterProduct = () => {
      for (const category of initialCategories) {
        const water = category.products.find(
          (p) =>
            p.name.toLowerCase().includes("water") &&
            (p.name.toLowerCase().includes("bottle") ||
              p.name.toLowerCase().includes("bottled")),
        );
        if (water) {
          setWaterProduct(water);
          setWaterPrice(water.basePrice);
          setWaterName(water.name);
          setWaterImageUrl(water.imageUrl || "");
          setWaterIsQuickCartItem(water.isQuickCartItem !== false); // default true if undefined
          return;
        }
      }
    };
    findWaterProduct();
  }, [initialCategories]);

  // Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);

  // Editing states
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [editingIngredients, setEditingIngredients] = useState<
    { inventoryItemId: string; quantityRequired: number }[]
  >([]);

  const [defaultModifierOptions, setDefaultModifierOptions] = useState<
    Record<string, string>
  >({});
  const [selectedModifierGroups, setSelectedModifierGroups] = useState<string[]>([]);
  const [waterProduct, setWaterProduct] = useState<Product | null>(null);
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  const [waterPrice, setWaterPrice] = useState("1.50");
  const [waterName, setWaterName] = useState("Bottled Water");
  const [waterImageUrl, setWaterImageUrl] = useState("");
  const [waterIsQuickCartItem, setWaterIsQuickCartItem] = useState(true);

  const [saleMode, setSaleMode] = useState<"none" | "PERCENTAGE" | "FIXED">(
    "none",
  );
  const [saleValueInput, setSaleValueInput] = useState("");
  const [saleLabelInput, setSaleLabelInput] = useState("");
  const [pricePreviewBase, setPricePreviewBase] = useState("");

  const [editingModifierGroup, setEditingModifierGroup] = useState<{
    id?: string;
    name: string;
    displayMode: "list" | "buttons" | "cards";
    defaultOptionId?: string | null;
    defaultOptionIndex?: number | null; // For new groups before options have IDs
    options: { id?: string; name: string; price: number; imageUrl?: string }[];
  } | null>(null);

  const [mobileActionsProductId, setMobileActionsProductId] = useState<
    string | null
  >(null);
  const mobileActionsRowRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!mobileActionsProductId) return;
    const handle = (e: MouseEvent | TouchEvent) => {
      if (
        mobileActionsRowRef.current &&
        !mobileActionsRowRef.current.contains(e.target as Node)
      ) {
        setMobileActionsProductId(null);
      }
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [mobileActionsProductId]);

  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: "" });
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: (() => void) | null;
  }>({ isOpen: false, title: "", message: "", action: null });

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const openProductModal = (
    product: Product | null,
    categoryId: string | null,
  ) => {
    setEditingProduct(product);
    setActiveCategoryId(categoryId);
    if (product && product.productIngredients) {
      setEditingIngredients(
        product.productIngredients.map((pi) => ({
          inventoryItemId: pi.inventoryItemId,
          quantityRequired: parseFloat(pi.quantityRequired),
        })),
      );
    } else {
      setEditingIngredients([]);
    }
    // Initialize default modifier options from product
    if (product && product.modifierLinks) {
      const defaults: Record<string, string> = {};
      const selected: string[] = [];
      product.modifierLinks.forEach((link) => {
        selected.push(link.modifierGroupId);
        if (link.defaultModifierOptionId) {
          defaults[link.modifierGroupId] = link.defaultModifierOptionId;
        }
      });
      setDefaultModifierOptions(defaults);
      setSelectedModifierGroups(selected);
    } else {
      setDefaultModifierOptions({});
      setSelectedModifierGroups([]);
    }
    setIsProductModalOpen(true);
  };

  useEffect(() => {
    if (!isProductModalOpen) return;
    if (editingProduct) {
      const t = editingProduct.saleDiscountType;
      setSaleMode(t === "PERCENTAGE" || t === "FIXED" ? t : "none");
      setSaleValueInput(
        editingProduct.saleDiscountValue != null
          ? String(editingProduct.saleDiscountValue)
          : "",
      );
      setSaleLabelInput(editingProduct.saleLabel ?? "");
      setPricePreviewBase(String(editingProduct.basePrice ?? ""));
    } else {
      setSaleMode("none");
      setSaleValueInput("");
      setSaleLabelInput("");
      setPricePreviewBase("");
    }
  }, [isProductModalOpen, editingProduct]);

  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const flow = formData.get("flow") as string;

    const config = JSON.stringify({ flow });

    if (editingCategory?.id) {
      await updateCategory(editingCategory.id, name, type, config);
    } else {
      await createCategory(name, type, config);
    }
    window.location.reload();
  };

  const handleDeleteCategory = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Category",
      message:
        "Are you sure you want to delete this category? All products in it will be affected.",
      action: async () => {
        const result = await deleteCategory(id);
        if (result.success) {
          toast.success("Category deleted successfully");
          window.location.reload();
        } else {
          toast.error(result.error || "Failed to delete category");
        }
      },
    });
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const basePrice = formData.get("basePrice") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const categoryId = activeCategoryId || editingProduct?.categoryId;

    if (!categoryId) return;

    const isHidden = formData.get("isHidden") === "on";
    const isFeatured = formData.get("isFeatured") === "on";

    const saleDiscountType =
      saleMode !== "none" && saleValueInput.trim() !== ""
        ? saleMode
        : null;
    const saleDiscountValue =
      saleDiscountType && saleValueInput.trim() !== ""
        ? saleValueInput.trim()
        : null;

    // Build modifier groups with default options
    const modifierGroupIds = formData.getAll("modifierGroups") as string[];
    const modifierGroups = modifierGroupIds.map((groupId) => ({
      modifierGroupId: groupId,
      defaultModifierOptionId: defaultModifierOptions[groupId] || undefined,
    }));

    const data = {
      categoryId,
      name,
      basePrice,
      imageUrl: imageUrl || undefined,
      modifierGroups,
      isHidden,
      isFeatured,
      isQuickCartItem: editingProduct?.isQuickCartItem,
      saleDiscountType,
      saleDiscountValue,
      saleLabel: saleLabelInput.trim() || null,
    };

    let productId = editingProduct?.id;

    if (editingProduct) {
      await updateProduct(editingProduct.id, data);
    } else {
      const newProduct = await createProduct(data);
      productId = newProduct.id;
    }

    // Save Ingredients
    const validIngredients = editingIngredients.filter(
      (i) => i.inventoryItemId && i.quantityRequired > 0,
    );
    if (productId) {
      await linkProductToIngredientsAction(
        branchId,
        productId,
        validIngredients,
      );
    }

    window.location.reload();
  };

  const handleDeleteProduct = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Product",
      message:
        "Are you sure you want to permanently delete this product? It will be removed from the menu, all modifier links, promotions, and stock settings. Historical orders that included this item will be preserved but the product link will be cleared.",
      action: async () => {
        const result = await deleteProduct(id);
        if (result.success) {
          toast.success("Product deleted successfully");
          window.location.reload();
        } else {
          toast.error(result.error || "Failed to delete product");
        }
      },
    });
  };

  // ... helpers for ingredients ...
  const addIngredient = () => {
    setEditingIngredients([
      ...editingIngredients,
      { inventoryItemId: "", quantityRequired: 0 },
    ]);
  };
  const updateIngredient = (
    index: number,
    field: "inventoryItemId" | "quantityRequired",
    value: string | number,
  ) => {
    const newIngs = [...editingIngredients];
    // @ts-ignore
    newIngs[index][field] = value;
    setEditingIngredients(newIngs);
  };
  const removeIngredient = (index: number) => {
    setEditingIngredients(editingIngredients.filter((_, i) => i !== index));
  };

  const handleSaveModifier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModifierGroup) return;

    if (!editingModifierGroup.name.trim()) {
      setAlertConfig({ isOpen: true, message: "Please enter a group name" });
      return;
    }

    const validOptions = editingModifierGroup.options.filter(
      (o) => o.name.trim() !== "",
    );

    if (editingModifierGroup.id) {
      // For existing groups, use defaultOptionId directly
      await updateModifierGroup(
        editingModifierGroup.id,
        editingModifierGroup.name,
        validOptions,
        editingModifierGroup.displayMode,
        editingModifierGroup.defaultOptionId,
      );
    } else {
      // For new groups, we'll set defaultOptionId after options are created
      // We'll pass the index, and the backend will handle it
      await createModifierGroup(
        editingModifierGroup.name,
        validOptions,
        editingModifierGroup.displayMode,
        editingModifierGroup.defaultOptionIndex !== null &&
          editingModifierGroup.defaultOptionIndex !== undefined
          ? validOptions[editingModifierGroup.defaultOptionIndex]?.name // Pass name as identifier for new groups
          : null,
      );
    }
    window.location.reload();
  };

  const handleDeleteModifier = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Modifier Group",
      message:
        "Are you sure? This will remove this modifier group from all products.",
      action: async () => {
        await deleteModifierGroup(id);
        window.location.reload();
      },
    });
  };

  const handleSaveWaterProduct = async () => {
    if (!waterName.trim()) {
      setAlertConfig({ isOpen: true, message: "Please enter a product name" });
      return;
    }
    if (!waterProduct) {
      // Create water product if it doesn't exist
      const othersCategory = categories.find(
        (c) => c.type === "others" || c.name.toLowerCase() === "others",
      );
      if (!othersCategory) {
        setAlertConfig({
          isOpen: true,
          message: 'Please create an "Others" category first',
        });
        return;
      }
      const newProduct = await createProduct({
        categoryId: othersCategory.id,
        name: waterName,
        basePrice: waterPrice,
        imageUrl: waterImageUrl || undefined,
        isHidden: false,
        isQuickCartItem: waterIsQuickCartItem,
      });
      setWaterProduct(newProduct);
    } else {
      // Update existing water product
      await updateProduct(waterProduct.id, {
        categoryId: waterProduct.categoryId,
        name: waterName,
        basePrice: waterPrice,
        imageUrl: waterImageUrl || undefined,
        modifierGroups: [],
        isHidden: waterProduct.isHidden || false,
        isQuickCartItem: waterIsQuickCartItem,
      });
    }
    window.location.reload();
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Water Product Quick Settings */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex items-start gap-4">
          {/* Image preview */}
          <div className="relative w-16 h-16 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {waterImageUrl ? (
              <Image
                src={waterImageUrl}
                alt={waterName}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Droplet className="text-blue-400" size={24} />
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplet className="text-blue-500" size={16} />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Water Bottle Product
                  </h3>
                  <p className="text-xs text-gray-500">
                    Quick cart access product shown in Cart header
                  </p>
                </div>
              </div>
              {/* Visibility Toggle */}
              <button
                type="button"
                onClick={() => setWaterIsQuickCartItem((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ${
                  waterIsQuickCartItem ? "bg-[#D95D1E]" : "bg-gray-200"
                }`}
                title={
                  waterIsQuickCartItem
                    ? "Hide quick-cart button on cart page"
                    : "Show quick-cart button on cart page"
                }
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    waterIsQuickCartItem ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Visibility label */}
            <p
              className={`text-[11px] font-semibold ${waterIsQuickCartItem ? "text-emerald-600" : "text-gray-400"}`}
            >
              {waterIsQuickCartItem
                ? "✓ Quick-cart button visible on cart page"
                : "✕ Quick-cart button hidden on cart page"}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Name */}
              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={waterName}
                  onChange={(e) => setWaterName(e.target.value)}
                  placeholder="e.g. Bottled Water"
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold focus:border-[#D95D1E] focus:ring-1 focus:ring-[#D95D1E]"
                />
              </div>

              {/* Image URL */}
              <div className="md:col-span-1">
                <label className="flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  Image URL <GoogleDriveImageGuide />
                </label>
                <input
                  type="text"
                  value={waterImageUrl}
                  onChange={(e) => setWaterImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-[#D95D1E] focus:ring-1 focus:ring-[#D95D1E]"
                />
              </div>

              {/* Price + Save */}
              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  Price
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                      ₱
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={waterPrice}
                      onChange={(e) => setWaterPrice(e.target.value)}
                      className="w-full pl-6 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:border-[#D95D1E] focus:ring-1 focus:ring-[#D95D1E]"
                    />
                  </div>
                  <button
                    onClick={handleSaveWaterProduct}
                    className="px-4 py-1.5 bg-[#D95D1E] text-white text-sm font-bold rounded-lg hover:bg-[#bf4f18] transition-colors whitespace-nowrap"
                  >
                    {waterProduct ? "Update" : "Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Menu Management
          </h1>
          <p className="text-gray-500 mt-1">
            Configure your digital menu, categories, and customization options.
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-fit overflow-x-auto md:overflow-visible">
          <div className="flex flex-nowrap md:flex-wrap gap-0.5 min-h-[44px] items-stretch shrink-0">
            <button
              onClick={() => setActiveTab("menu")}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all shrink-0 min-h-[44px] ${activeTab === "menu" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              Menu & Categories
            </button>
            <button
              onClick={() => setActiveTab("modifiers")}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all shrink-0 min-h-[44px] ${activeTab === "modifiers" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              Modifiers
            </button>
            <button
              onClick={() => setActiveTab("toppings")}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all shrink-0 min-h-[44px] ${activeTab === "toppings" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              Toppings
            </button>
          </div>
        </div>
      </div>

      {activeTab === "menu" ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Categories</h2>
            <button
              onClick={() => {
                setEditingCategory(null);
                setIsCategoryModalOpen(true);
              }}
              className="bg-[#D95D1E] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#bf4f18] transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <Plus size={20} />
              Add Category
            </button>
          </div>

          <DndContext
            id="menu-categories-sort"
            sensors={categorySensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCategoryDragEnd}
          >
            <SortableContext
              items={categories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {categories.map((category) => (
                  <SortableCategoryCard
                    key={category.id}
                    category={category}
                    expanded={expandedCategories.includes(category.id)}
                    onToggle={() => toggleCategory(category.id)}
                    onAddProduct={() => openProductModal(null, category.id)}
                    onEditCategory={() => {
                      setEditingCategory(category);
                      setIsCategoryModalOpen(true);
                    }}
                    onDeleteCategory={() => handleDeleteCategory(category.id)}
                    setCategories={setCategories}
                    mobileActionsProductId={mobileActionsProductId}
                    setMobileActionsProductId={setMobileActionsProductId}
                    mobileActionsRowRef={mobileActionsRowRef}
                    openProductModal={openProductModal}
                    handleDeleteProduct={handleDeleteProduct}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-800">
                {activeTab === "toppings"
                  ? "Visual Toppings"
                  : "Standard Modifiers"}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {activeTab === "toppings"
                  ? "Create rich visual options with images (e.g., Toppings, Add-ons)."
                  : "Create standard list or button options (e.g., Size, Sugar, Milk)."}
              </p>
            </div>
            <button
              onClick={() => {
                setEditingModifierGroup({
                  name: "",
                  displayMode: activeTab === "toppings" ? "cards" : "list",
                  defaultOptionId: null,
                  defaultOptionIndex: null,
                  options: [{ name: "", price: 0 }],
                });
                setIsModifierModalOpen(true);
              }}
              className="w-full md:w-auto bg-[#D95D1E] text-white px-4 py-3 md:py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[#bf4f18] transition-all shadow-md active:scale-95 whitespace-nowrap"
            >
              <Plus size={20} />
              Add Group
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modifierGroups.filter((g) =>
              activeTab === "toppings"
                ? g.displayMode === "cards"
                : g.displayMode !== "cards",
            ).length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-300 p-8 md:p-20 text-center">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings2 size={32} className="text-gray-300" />
                </div>
                <h3 className="text-gray-900 font-bold mb-1">
                  No {activeTab === "toppings" ? "Toppings" : "Modifiers"} Yet
                </h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                  Create a group to start customization.
                </p>
              </div>
            ) : (
              modifierGroups
                .filter((g) =>
                  activeTab === "toppings"
                    ? g.displayMode === "cards"
                    : g.displayMode !== "cards",
                )
                .map((group) => (
                  <div
                    key={group.id}
                    className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200 shadow-sm relative group hover:border-[#D95D1E]/30 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4 pr-20 md:pr-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900 truncate">
                            {group.name}
                          </h3>
                          <span className="text-[10px] uppercase font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded shrink-0">
                            {group.displayMode}
                          </span>
                        </div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-1">
                          {group.options.length} OPTIONS
                        </p>
                      </div>
                      <div className="absolute top-4 right-4 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingModifierGroup({
                              id: group.id,
                              name: group.name,
                              displayMode: group.displayMode,
                              defaultOptionId: group.defaultOptionId || null,
                              options: group.options.map((o) => ({
                                id: o.id,
                                name: o.name,
                                price: parseFloat(o.price),
                                imageUrl: o.imageUrl || undefined,
                              })),
                            });
                            setIsModifierModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteModifier(group.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.options.slice(0, 5).map((opt) => (
                        <span
                          key={opt.id}
                          className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full border border-gray-100 flex items-center gap-1"
                        >
                          {activeTab === "toppings" && opt.imageUrl && (
                            <img
                              src={opt.imageUrl}
                              className="w-4 h-4 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          {opt.name}
                          {parseFloat(opt.price) > 0 && (
                            <span className="text-[#D95D1E] font-bold">
                              +{opt.price}
                            </span>
                          )}
                        </span>
                      ))}
                      {group.options.length > 5 && (
                        <span className="px-2.5 py-1 bg-gray-50 text-gray-400 text-xs font-medium rounded-full border border-gray-100">
                          +{group.options.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Modals - using a unified glass background */}
      {(isCategoryModalOpen || isProductModalOpen || isModifierModalOpen) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100] transition-all animate-in fade-in duration-200" />
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                {editingCategory ? "Edit Category" : "New Category"}
              </h2>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={handleSaveCategory}
              className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Internal Name
                </label>
                <input
                  name="name"
                  type="text"
                  defaultValue={editingCategory?.name}
                  required
                  autoFocus
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#D95D1E] transition-all text-lg font-medium"
                  placeholder="e.g. Signature Coffees"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Display Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["drink", "snack", "meal"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        const form = document.querySelector(
                          "form",
                        ) as HTMLFormElement;
                        const select = form.querySelector(
                          'select[name="type"]',
                        ) as HTMLSelectElement;
                        select.value = type;
                        // Trigger reactive update if needed, but here we just manually style for now
                        setEditingCategory((prev) =>
                          prev
                            ? { ...prev, type }
                            : { id: "", name: "", type, products: [] },
                        );
                      }}
                      className={`py-3 px-4 rounded-xl text-sm font-bold capitalize transition-all border ${editingCategory?.type === type || (!editingCategory && type === "drink") ? "bg-[#D95D1E] border-[#D95D1E] text-white" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                    >
                      {type}
                    </button>
                  ))}
                  <select
                    name="type"
                    className="hidden"
                    defaultValue={editingCategory?.type || "drink"}
                  >
                    <option value="drink">drink</option>
                    <option value="snack">snack</option>
                    <option value="meal">meal</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Customization Flow
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: "drink_full",
                      name: "Standard Drink",
                      desc: "Size → Add-ons → Toppings",
                    },
                    {
                      id: "simple_choice",
                      name: "Simple Pick",
                      desc: "Just list the items with prices",
                    },
                    {
                      id: "fixed_meal",
                      name: "Meal Set",
                      desc: "Main Choice → Side → Drinks",
                    },
                  ].map((f) => {
                    const currentFlow = editingCategory?.config
                      ? JSON.parse(editingCategory.config).flow
                      : "drink_full";
                    return (
                      <label
                        key={f.id}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${currentFlow === f.id ? "bg-orange-50 border-[#D95D1E]" : "bg-white border-gray-100 hover:border-gray-200"}`}
                      >
                        <input
                          type="radio"
                          name="flow"
                          value={f.id}
                          defaultChecked={currentFlow === f.id}
                          className="w-4 h-4 text-[#D95D1E] focus:ring-[#D95D1E]"
                        />
                        <div>
                          <div className="font-bold text-gray-900 text-sm">
                            {f.name}
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium">
                            {f.desc}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between gap-3 pt-4 sticky bottom-0 bg-white border-t border-gray-50 mt-auto">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-8 py-3 bg-[#D95D1E] text-white rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-[#bf4f18] transition-all active:scale-95"
                >
                  {editingCategory ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white z-20">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="text-sm text-gray-400 font-medium">
                  Configure product details and modifiers.
                </p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={handleSaveProduct}
              className="p-8 space-y-6 overflow-y-auto custom-scrollbar"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                      Display Name
                    </label>
                    <input
                      name="name"
                      type="text"
                      defaultValue={editingProduct?.name}
                      required
                      className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#D95D1E] transition-all font-semibold"
                      placeholder="Caramel Macchiato"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                      Price (PHP)
                    </label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                        ₱
                      </span>
                      <input
                        name="basePrice"
                        type="number"
                        step="0.01"
                        value={pricePreviewBase}
                        onChange={(e) => setPricePreviewBase(e.target.value)}
                        required
                        className="w-full pl-10 pr-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#D95D1E] transition-all font-bold"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                      Display Visibility & Promotion
                    </label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-2xl cursor-pointer hover:bg-white transition-all border border-transparent hover:border-gray-100">
                        <input
                          name="isHidden"
                          type="checkbox"
                          defaultChecked={editingProduct?.isHidden}
                          className="w-5 h-5 rounded-lg border-gray-300 text-[#D95D1E] focus:ring-[#D95D1E]"
                        />
                        <span className="text-sm font-semibold text-gray-600">
                          Hide from Customer Menu
                        </span>
                      </label>
                      <label className="flex items-center gap-3 p-3.5 bg-orange-50/50 rounded-2xl cursor-pointer hover:bg-orange-50 transition-all border border-transparent hover:border-orange-100">
                        <input
                          name="isFeatured"
                          type="checkbox"
                          defaultChecked={editingProduct?.isFeatured}
                          className="w-5 h-5 rounded-lg border-orange-300 text-[#D95D1E] focus:ring-[#D95D1E]"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">
                            Featured Product
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">
                            Shows at the top of the menu with a badge
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Cover Image <GoogleDriveImageGuide />
                  </label>
                  <div className="flex-1 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-4 group hover:border-[#D95D1E]/30 transition-all cursor-pointer overflow-hidden relative">
                    {editingProduct?.imageUrl ? (
                      <Image
                        src={editingProduct.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <>
                        <ImageIcon
                          size={32}
                          className="text-gray-300 mb-2 group-hover:text-[#D95D1E]/50"
                        />
                        <p className="text-[10px] text-gray-400 text-center px-4">
                          Cloudflare R2 storage coming soon
                        </p>
                      </>
                    )}
                    <input
                      name="imageUrl"
                      type="text"
                      defaultValue={editingProduct?.imageUrl || ""}
                      className="absolute bottom-2 left-2 right-2 px-2 py-1.5 text-[10px] bg-white/90 backdrop-blur rounded-lg border border-gray-100 focus:outline-[#D95D1E]"
                      placeholder="Paste image URL here..."
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                  Per-product sale (optional)
                </label>
                <div className="space-y-3 max-w-xl">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Discount type
                    </label>
                    <select
                      value={saleMode}
                      onChange={(e) =>
                        setSaleMode(
                          e.target.value as "none" | "PERCENTAGE" | "FIXED",
                        )
                      }
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl font-semibold border-none focus:ring-2 focus:ring-[#D95D1E]"
                    >
                      <option value="none">No sale</option>
                      <option value="PERCENTAGE">Percentage off</option>
                      <option value="FIXED">Fixed amount off (PHP)</option>
                    </select>
                  </div>
                  {saleMode !== "none" && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        {saleMode === "PERCENTAGE"
                          ? "Percent off"
                          : "Amount off (PHP)"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={saleValueInput}
                        onChange={(e) => setSaleValueInput(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 rounded-2xl font-bold border-none focus:ring-2 focus:ring-[#D95D1E]"
                        placeholder={saleMode === "PERCENTAGE" ? "10" : "20.00"}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Sale label (optional)
                    </label>
                    <input
                      type="text"
                      value={saleLabelInput}
                      onChange={(e) => setSaleLabelInput(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl font-medium border-none focus:ring-2 focus:ring-[#D95D1E]"
                      placeholder='e.g. "Happy Hour"'
                    />
                  </div>
                  {(() => {
                    const list = parseFloat(pricePreviewBase || "0");
                    if (Number.isNaN(list)) return null;
                    const r = resolveProductMenuPrice(list, {
                      saleDiscountType:
                        saleMode === "none" || !saleValueInput.trim()
                          ? null
                          : saleMode,
                      saleDiscountValue: saleValueInput,
                      saleLabel: saleLabelInput,
                    });
                    if (
                      r.compareAtPrice != null &&
                      r.price < r.compareAtPrice - 0.001
                    ) {
                      return (
                        <p className="text-sm text-gray-600 bg-orange-50/50 rounded-xl px-4 py-3 border border-orange-100">
                          Customer sees:{" "}
                          <span className="line-through text-gray-400">
                            ₱{r.compareAtPrice.toFixed(2)}
                          </span>{" "}
                          →{" "}
                          <span className="font-bold text-[#D95D1E]">
                            ₱{r.price.toFixed(2)}
                          </span>
                          {r.saleLabel ? (
                            <span className="ml-2 text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                              {r.saleLabel}
                            </span>
                          ) : null}
                        </p>
                      );
                    }
                    return (
                      <p className="text-xs text-gray-400">
                        Branch price overrides (if any) apply before this sale on
                        the live menu and POS.
                      </p>
                    );
                  })()}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                  Linked Modifiers
                </label>
                <div className="space-y-4">
                  {modifierGroups.length === 0 ? (
                    <p className="text-xs text-gray-400 italic bg-gray-50 p-6 rounded-2xl text-center border border-dashed border-gray-200">
                      Go to the 'Modifiers' tab to create your first
                      customization group.
                    </p>
                  ) : (
                    modifierGroups.map((group) => {
                      const isChecked = selectedModifierGroups.includes(group.id);
                      const currentDefault =
                        defaultModifierOptions[group.id] || "";
                      return (
                        <div
                          key={group.id}
                          className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-[#D95D1E]/20 transition-all"
                        >
                          <label className="flex items-center gap-4 cursor-pointer">
                            <input
                              type="checkbox"
                              name="modifierGroups"
                              value={group.id}
                              checked={isChecked}
                              onChange={(e) => {
                                if (!e.target.checked) {
                                  setSelectedModifierGroups(prev => prev.filter(id => id !== group.id));
                                  const newDefaults = {
                                    ...defaultModifierOptions,
                                  };
                                  delete newDefaults[group.id];
                                  setDefaultModifierOptions(newDefaults);
                                } else {
                                  setSelectedModifierGroups(prev => [...prev, group.id]);
                                }
                              }}
                              className="w-5 h-5 rounded-lg border-gray-300 text-[#D95D1E] focus:ring-[#D95D1E]"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-bold text-gray-700">
                                {group.name}
                              </span>
                              <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter mt-0.5 truncate">
                                {group.options.length > 0
                                  ? group.options.map((o) => o.name).join(", ")
                                  : "0 OPTIONS"}
                              </p>
                              {isChecked && group.options.length > 0 && (
                                <div className="mt-3">
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                    Default Option
                                  </label>
                                  <select
                                    value={currentDefault}
                                    onChange={(e) => {
                                      setDefaultModifierOptions({
                                        ...defaultModifierOptions,
                                        [group.id]: e.target.value || "",
                                      });
                                    }}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#D95D1E] focus:border-[#D95D1E]"
                                  >
                                    <option value="">None (no default)</option>
                                    {group.options.map((opt) => (
                                      <option key={opt.id} value={opt.id}>
                                        {opt.name}{" "}
                                        {parseFloat(opt.price) > 0
                                          ? `(+₱${opt.price})`
                                          : ""}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                  Recipe / Ingredients
                </label>
                <div className="space-y-3">
                  {editingIngredients.map((ing, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <div className="flex-1">
                        <select
                          className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#D95D1E] text-sm font-medium"
                          value={ing.inventoryItemId}
                          onChange={(e) =>
                            updateIngredient(
                              index,
                              "inventoryItemId",
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Select Ingredient</option>
                          {inventoryItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Qty"
                          className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#D95D1E] text-sm font-medium"
                          value={ing.quantityRequired}
                          onChange={(e) =>
                            updateIngredient(
                              index,
                              "quantityRequired",
                              parseFloat(e.target.value),
                            )
                          }
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="flex items-center gap-2 text-sm font-bold text-[#D95D1E] hover:underline px-2 py-1"
                  >
                    <Plus size={16} />
                    Add Ingredient
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-8 pb-4">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-2xl transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-[#D95D1E] text-white rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-[#bf4f18] transition-all active:scale-95"
                >
                  {editingProduct ? "Save Product" : "Add to Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modifier Modal */}
      {isModifierModalOpen && editingModifierGroup && (
        <div className="fixed inset-0 flex items-end md:items-center justify-center z-[110] p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 md:p-6 border-b border-gray-50 flex justify-between items-center shrink-0">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight min-w-0 pr-2">
                {editingModifierGroup.id
                  ? activeTab === "toppings"
                    ? "Edit Toppings Group"
                    : "Edit Modifier Group"
                  : activeTab === "toppings"
                    ? "New Toppings Group"
                    : "New Modifier Group"}
              </h2>
              <button
                onClick={() => setIsModifierModalOpen(false)}
                className="p-2.5 -m-2.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 shrink-0"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={handleSaveModifier}
              className="flex-1 flex flex-col overflow-hidden min-h-0"
            >
              <div className="p-4 md:p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1 min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Group Name
                    </label>
                    <input
                      value={editingModifierGroup.name}
                      onChange={(e) =>
                        setEditingModifierGroup({
                          ...editingModifierGroup,
                          name: e.target.value,
                        })
                      }
                      required
                      autoFocus
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#D95D1E] transition-all font-bold"
                      placeholder={
                        activeTab === "toppings"
                          ? "e.g. Premium Toppings"
                          : "e.g. Milk Choice"
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Display Mode
                    </label>
                    <div className="flex flex-wrap sm:flex-nowrap bg-gray-50 rounded-xl p-1 gap-0.5">
                      {[
                        { id: "list", label: "List" },
                        { id: "buttons", label: "Buttons" },
                        { id: "cards", label: "Cards (Images)" },
                      ].map((mode: any) => (
                        <button
                          type="button"
                          key={mode.id}
                          onClick={() =>
                            setEditingModifierGroup({
                              ...editingModifierGroup,
                              displayMode: mode.id,
                            })
                          }
                          className={`flex-1 min-w-0 py-2.5 sm:py-2 text-xs font-bold rounded-lg transition-all ${editingModifierGroup.displayMode === mode.id ? "bg-white shadow text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="flex items-center text-xs font-bold uppercase tracking-wider text-gray-400">
                      Options
                      {editingModifierGroup.displayMode === "cards" && (
                        <GoogleDriveImageGuide />
                      )}
                    </label>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-lg">
                      <span className="text-[10px] text-[#D95D1E] font-bold">
                        ⭐
                      </span>
                      <span className="text-[10px] text-[#D95D1E] font-semibold">
                        Click star to set default
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {editingModifierGroup.options.map((opt, idx) => {
                      const isDefault =
                        editingModifierGroup.defaultOptionId === opt.id ||
                        (editingModifierGroup.defaultOptionIndex === idx &&
                          !opt.id);
                      return (
                        <div
                          key={idx}
                          className={`flex gap-3 items-start p-4 rounded-2xl border-2 transition-all animate-in slide-in-from-left-2 duration-200 ${
                            isDefault
                              ? "bg-orange-50 border-[#D95D1E] shadow-sm"
                              : "bg-gray-50 border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (opt.id) {
                                setEditingModifierGroup({
                                  ...editingModifierGroup,
                                  defaultOptionId: isDefault ? null : opt.id,
                                  defaultOptionIndex: null,
                                });
                              } else {
                                setEditingModifierGroup({
                                  ...editingModifierGroup,
                                  defaultOptionId: null,
                                  defaultOptionIndex: isDefault ? null : idx,
                                });
                              }
                            }}
                            className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                              isDefault
                                ? "bg-[#D95D1E] text-white shadow-md"
                                : "bg-white border-2 border-gray-200 text-gray-400 hover:border-[#D95D1E] hover:text-[#D95D1E]"
                            }`}
                            title={
                              isDefault
                                ? "Remove as default"
                                : "Set as default option"
                            }
                          >
                            {isDefault ? (
                              <span className="text-lg">⭐</span>
                            ) : (
                              <span className="text-sm opacity-50">☆</span>
                            )}
                          </button>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                              <input
                                value={opt.name}
                                onChange={(e) => {
                                  const newOpts = [
                                    ...editingModifierGroup.options,
                                  ];
                                  newOpts[idx].name = e.target.value;
                                  setEditingModifierGroup({
                                    ...editingModifierGroup,
                                    options: newOpts,
                                  });
                                }}
                                placeholder="Option Name"
                                className={`flex-1 min-w-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                  isDefault
                                    ? "bg-white border-2 border-[#D95D1E]/30 focus:border-[#D95D1E]"
                                    : "bg-white border border-gray-200 focus:border-[#D95D1E] focus:ring-2 focus:ring-[#D95D1E]/20"
                                }`}
                              />
                              <div className="relative w-full sm:w-28 shrink-0">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                                  ₱
                                </span>
                                <input
                                  type="number"
                                  value={opt.price}
                                  onChange={(e) => {
                                    const newOpts = [
                                      ...editingModifierGroup.options,
                                    ];
                                    newOpts[idx].price =
                                      parseFloat(e.target.value) || 0;
                                    setEditingModifierGroup({
                                      ...editingModifierGroup,
                                      options: newOpts,
                                    });
                                  }}
                                  className={`w-full pl-7 pr-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                    isDefault
                                      ? "bg-white border-2 border-[#D95D1E]/30 focus:border-[#D95D1E]"
                                      : "bg-white border border-gray-200 focus:border-[#D95D1E] focus:ring-2 focus:ring-[#D95D1E]/20"
                                  }`}
                                />
                              </div>
                            </div>
                            {editingModifierGroup.displayMode === "cards" && (
                              <input
                                value={opt.imageUrl || ""}
                                onChange={(e) => {
                                  const newOpts = [
                                    ...editingModifierGroup.options,
                                  ];
                                  newOpts[idx].imageUrl = e.target.value;
                                  setEditingModifierGroup({
                                    ...editingModifierGroup,
                                    options: newOpts,
                                  });
                                }}
                                placeholder="Image URL (https://...)"
                                className={`w-full px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                                  isDefault
                                    ? "bg-white border-2 border-[#D95D1E]/30 focus:border-[#D95D1E]"
                                    : "bg-white border border-gray-200 focus:border-[#D95D1E] focus:ring-2 focus:ring-[#D95D1E]/20"
                                }`}
                              />
                            )}
                            {isDefault && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[10px] font-bold text-[#D95D1E] uppercase tracking-wider bg-orange-100 px-2 py-0.5 rounded-full">
                                  Default Option
                                </span>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newOpts =
                                editingModifierGroup.options.filter(
                                  (_, i) => i !== idx,
                                );
                              // Clear defaultOptionId/defaultOptionIndex if the deleted option was the default
                              const wasDefault =
                                editingModifierGroup.defaultOptionId ===
                                  opt.id ||
                                editingModifierGroup.defaultOptionIndex === idx;
                              const newDefaultOptionId = wasDefault
                                ? null
                                : editingModifierGroup.defaultOptionId;
                              const newDefaultOptionIndex = wasDefault
                                ? null
                                : editingModifierGroup.defaultOptionIndex !==
                                      null &&
                                    editingModifierGroup.defaultOptionIndex !==
                                      undefined &&
                                    editingModifierGroup.defaultOptionIndex >
                                      idx
                                  ? editingModifierGroup.defaultOptionIndex - 1
                                  : editingModifierGroup.defaultOptionIndex;
                              setEditingModifierGroup({
                                ...editingModifierGroup,
                                options: newOpts,
                                defaultOptionId: newDefaultOptionId,
                                defaultOptionIndex: newDefaultOptionIndex,
                              });
                            }}
                            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex-shrink-0"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingModifierGroup({
                        ...editingModifierGroup,
                        options: [
                          ...editingModifierGroup.options,
                          { name: "", price: 0 },
                        ],
                      })
                    }
                    className="mt-4 flex items-center gap-2 text-sm font-bold text-[#D95D1E] hover:bg-orange-50 px-4 py-2.5 rounded-xl transition-all border border-orange-100 hover:border-[#D95D1E]/30"
                  >
                    <Plus size={16} />
                    Add Option
                  </button>
                </div>
              </div>
              <div className="p-4 md:p-6 border-t border-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModifierModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 bg-[#D95D1E] text-white rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-[#bf4f18] transition-all active:scale-95"
                >
                  {editingModifierGroup.id ? "Save Changes" : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        message={alertConfig.message}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() =>
          setConfirmConfig({ ...confirmConfig, isOpen: false, action: null })
        }
        onConfirm={() => {
          if (confirmConfig.action) {
            confirmConfig.action();
            setConfirmConfig({ ...confirmConfig, isOpen: false, action: null });
          }
        }}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant="danger"
      />
    </div>
  );
}
