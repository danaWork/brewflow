'use client';

import { UserCircle, Trash2, Key, ChevronDown, Search, ArrowUpDown } from 'lucide-react';
import { useTransition, useState, useMemo } from 'react';
import { deleteUser, updateUserNotes } from '@/app/actions/admin';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface AdminUser {
    id: string;
    username: string;
    shopName: string | null;
    notes: string | null;
    created: string;
    createdAt?: string; // Original timestamp for sorting
}

export function UsersTab({ users }: { users: AdminUser[] }) {
    const [isPending, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'username' | 'shopName' | 'created'>('username');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, userId: string | null}>({ isOpen: false, userId: null });

    const handleDeleteClick = (userId: string) => {
        setConfirmConfig({ isOpen: true, userId });
    };

    const handleConfirmDelete = () => {
        if (!confirmConfig.userId) return;
        startTransition(async () => {
            await deleteUser(confirmConfig.userId!);
            setConfirmConfig({ isOpen: false, userId: null });
        });
    };

    const filteredAndSortedUsers = useMemo(() => {
        let result = users.filter(user =>
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.shopName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        );

        result.sort((a, b) => {
            const sortKey = sortBy === 'created' ? 'createdAt' : sortBy;
            let valA = (a as any)[sortKey] || '';
            let valB = (b as any)[sortKey] || '';

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [users, searchQuery, sortBy, sortOrder]);

    const toggleSort = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                        <UserCircle className="text-[#D46215]" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">All Users</h2>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search users or shops..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.currentTarget.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-lg md:rounded-xl pl-8 md:pl-10 pr-3 md:pr-4 py-2 text-sm outline-none focus:border-[#D46215] transition-all"
                        />
                    </div>

                    <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg md:rounded-xl px-2.5 md:px-3 py-1.5 md:py-2 gap-1.5 md:gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-transparent text-xs md:text-sm text-gray-500 outline-none cursor-pointer"
                        >
                            <option value="username">Username</option>
                            <option value="shopName">Shop Name</option>
                            <option value="created">Created</option>
                        </select>
                        <ChevronDown size={12} className="text-gray-400 pointer-events-none md:w-3.5 md:h-3.5" />
                    </div>

                    <button
                        onClick={toggleSort}
                        className={`p-2 md:p-2.5 bg-gray-50 border border-gray-100 rounded-lg md:rounded-xl text-gray-500 hover:text-[#D46215] transition-colors ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
                    >
                        <ArrowUpDown size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                </div>
            </div>

            {/* Mobile: card list */}
            <div className="md:hidden space-y-3">
                {filteredAndSortedUsers.map((user) => (
                    <UserCard key={user.id} user={user} onDelete={() => handleDeleteClick(user.id)} />
                ))}
                {filteredAndSortedUsers.length === 0 && (
                    <div className="py-10 text-center text-gray-400 italic text-sm">
                        No users found matching your search.
                    </div>
                )}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Username</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Shop Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Notes</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredAndSortedUsers.map((user) => (
                            <UserRow key={user.id} user={user} onDelete={() => handleDeleteClick(user.id)} />
                        ))}
                        {filteredAndSortedUsers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                                    No users found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmModal 
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig({ isOpen: false, userId: null })}
                onConfirm={handleConfirmDelete}
                title="Delete User"
                message="Are you sure you want to delete this user?"
                variant="danger"
            />
        </div>
    );
}

function UserCard({ user, onDelete }: { user: AdminUser; onDelete: () => void }) {
    const [notes, setNotes] = useState(user.notes || '');

    const handleNotesBlur = async () => {
        if (notes !== user.notes) {
            await updateUserNotes(user.id, notes);
        }
    };

    return (
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <div className="flex justify-between items-start gap-2 mb-2">
                <span className="font-semibold text-gray-700 text-sm">{user.username}</span>
                <span className="text-xs text-gray-400 shrink-0">{user.created}</span>
            </div>
            <div className="text-xs text-gray-500 mb-2">{user.shopName || 'N/A'}</div>
            <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Add notes..."
                className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-600 outline-none focus:border-[#D46215] transition-all mb-3"
            />
            <div className="flex justify-end gap-1">
                <button type="button" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg" aria-label="Key">
                    <Key size={16} />
                </button>
                <button type="button" onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 rounded-lg" aria-label="Delete">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}

function UserRow({ user, onDelete }: { user: AdminUser; onDelete: () => void }) {
    const [notes, setNotes] = useState(user.notes || '');

    const handleNotesBlur = async () => {
        if (notes !== user.notes) {
            await updateUserNotes(user.id, notes);
        }
    };

    return (
        <tr className="hover:bg-gray-50/50 transition-colors group">
            <td className="px-6 py-4">
                <span className="font-semibold text-gray-700">{user.username}</span>
            </td>
            <td className="px-6 py-4">
                <span className="text-gray-500">{user.shopName || 'N/A'}</span>
            </td>
            <td className="px-6 py-4">
                <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                    placeholder="Add personal notes..."
                    className="w-full bg-transparent border border-transparent hover:border-gray-200 focus:border-[#D46215] rounded-lg px-2 py-1 text-sm text-gray-600 outline-none transition-all"
                />
            </td>
            <td className="px-6 py-4">
                <span className="text-gray-400 text-sm">{user.created}</span>
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Key size={18} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );
}
