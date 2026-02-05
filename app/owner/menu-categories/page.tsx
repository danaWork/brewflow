import { UtensilsCrossed } from 'lucide-react';

export default function MenuCategoriesPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <div className="bg-gray-100 p-6 rounded-full inline-block mb-6">
          <UtensilsCrossed size={48} className="text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Menu & Categories</h1>
        <p className="text-gray-500 max-w-md">
          Manage your menu items, categories, and pricing. Coming soon!
        </p>
      </div>
    </div>
  );
}
