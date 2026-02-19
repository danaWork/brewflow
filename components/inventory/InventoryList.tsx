'use client';

import { useState } from 'react';
import { InventoryItem, deleteInventoryItemAction, updateInventoryItemAction } from '@/app/actions/inventory';
import { Edit, Trash2, AlertTriangle, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface InventoryListProps {
    initialItems: InventoryItem[];
    branchId: string;
}

export default function InventoryList({ initialItems, branchId }: InventoryListProps) {
    const [items, setItems] = useState(initialItems);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<InventoryItem>>({});
    const router = useRouter();

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this item?')) {
            const res = await deleteInventoryItemAction(id);
            if (res.success) {
                setItems(items.filter(i => i.id !== id));
                router.refresh();
            } else {
                alert('Failed to delete item');
            }
        }
    };

    const startEdit = (item: InventoryItem) => {
        setEditingId(item.id);
        setEditForm(item);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async () => {
        if (!editingId) return;
        const res = await updateInventoryItemAction(editingId, editForm);
        if (res.success && res.item) {
            setItems(items.map(i => i.id === editingId ? res.item! : i));
            setEditingId(null);
            router.refresh();
        } else {
            alert('Failed to update item');
        }
    };

    return (
        <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                    <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quantity</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unit</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Threshold</th>
                        <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {items.map((item) => {
                        const isEditing = editingId === item.id;
                        const isLowStock = parseFloat(item.quantity) <= (parseFloat(item.lowStockThreshold || '0'));

                        return (
                            <tr key={item.id} className={`group hover:bg-gray-50/50 transition-colors ${isLowStock ? 'bg-red-50/50' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="border-none bg-gray-50 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#D95D1E]"
                                            value={editForm.name || ''}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            autoFocus
                                        />
                                    ) : (
                                        <div className="flex items-center">
                                            {isLowStock && <AlertTriangle className="text-red-500 w-4 h-4 mr-2" />}
                                            <div className="text-sm font-bold text-gray-900">{item.name}</div>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="border-none bg-gray-50 rounded-lg px-3 py-2 w-24 focus:ring-2 focus:ring-[#D95D1E]"
                                            value={editForm.quantity || ''}
                                            onChange={e => setEditForm({ ...editForm, quantity: e.target.value })}
                                        />
                                    ) : (
                                        <div className={`text-sm font-medium ${isLowStock ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                            {item.quantity}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="border-none bg-gray-50 rounded-lg px-3 py-2 w-20 focus:ring-2 focus:ring-[#D95D1E]"
                                            value={editForm.unit || ''}
                                            onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                                        />
                                    ) : (
                                        <div className="text-xs font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-1 rounded-md w-fit">{item.unit}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="border-none bg-gray-50 rounded-lg px-3 py-2 w-24 focus:ring-2 focus:ring-[#D95D1E]"
                                            value={editForm.lowStockThreshold || ''}
                                            onChange={e => setEditForm({ ...editForm, lowStockThreshold: e.target.value })}
                                        />
                                    ) : (
                                        <div className="text-sm text-gray-500">{item.lowStockThreshold}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {isEditing ? (
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={saveEdit} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Check size={18} /></button>
                                            <button onClick={cancelEdit} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><X size={18} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(item)} className="p-2 text-gray-400 hover:text-[#D95D1E] hover:bg-orange-50 rounded-lg transition-colors"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {items.length === 0 && (
                <div className="text-center py-12 text-gray-400 italic">No inventory items found. Add one to get started.</div>
            )}
        </div>
    );
}
