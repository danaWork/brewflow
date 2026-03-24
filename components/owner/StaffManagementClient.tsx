'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Users, Trash2, Plus, Pencil, Eye, EyeOff, CircleUser } from 'lucide-react';
import {
    createStaffMember,
    deleteStaffMember,
    updateStaffMember,
    type StaffMemberRow,
} from '@/app/actions/owner';
import Drawer from '@/components/ui/Drawer';

type Props = {
    initialStaff: StaffMemberRow[];
};

function formatCreatedAt(createdAt: Date | string) {
    const d = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
    return d.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export default function StaffManagementClient({ initialStaff }: Props) {
    const router = useRouter();
    const [staff, setStaff] = useState(initialStaff);

    useEffect(() => {
        setStaff(initialStaff);
    }, [initialStaff]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [notes, setNotes] = useState('');
    const [busy, setBusy] = useState(false);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selected, setSelected] = useState<StaffMemberRow | null>(null);
    const [panelMode, setPanelMode] = useState<'view' | 'edit'>('view');

    const [editEmail, setEditEmail] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [editNewPassword, setEditNewPassword] = useState('');
    const [showCreatePassword, setShowCreatePassword] = useState(false);
    const [showEditNewPassword, setShowEditNewPassword] = useState(false);

    const refresh = () => {
        router.refresh();
    };

    const openView = (member: StaffMemberRow) => {
        setSelected(member);
        setPanelMode('view');
        setEditEmail(member.email);
        setEditNotes(member.notes ?? '');
        setEditNewPassword('');
        setShowEditNewPassword(false);
        setDrawerOpen(true);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setSelected(null);
        setShowEditNewPassword(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        const result = await createStaffMember(email, password, notes || null);
        setBusy(false);
        if (result.success) {
            toast.success('Staff member created');
            setEmail('');
            setPassword('');
            setNotes('');
            refresh();
        } else {
            toast.error(result.error || 'Could not create staff');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this staff member? They will no longer be able to sign in.')) return;
        setBusy(true);
        const result = await deleteStaffMember(id);
        setBusy(false);
        if (result.success) {
            toast.success('Staff member removed');
            setStaff((s) => s.filter((u) => u.id !== id));
            if (selected?.id === id) closeDrawer();
            refresh();
        } else {
            toast.error(result.error || 'Could not remove staff');
        }
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected) return;
        setBusy(true);
        const result = await updateStaffMember(selected.id, {
            email: editEmail,
            notes: editNotes.trim() || null,
            newPasswordPlain: editNewPassword.trim() || undefined,
        });
        setBusy(false);
        if (result.success) {
            toast.success('Staff member updated');
            const nextEmail = editEmail.trim().toLowerCase();
            const nextNotes = editNotes.trim() || null;
            setStaff((s) =>
                s.map((u) =>
                    u.id === selected.id
                        ? { ...u, email: nextEmail, notes: nextNotes }
                        : u
                )
            );
            setSelected((prev) =>
                prev
                    ? {
                          ...prev,
                          email: nextEmail,
                          notes: nextNotes,
                      }
                    : null
            );
            setEditNewPassword('');
            setPanelMode('view');
            refresh();
        } else {
            toast.error(result.error || 'Could not update staff');
        }
    };

    return (
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">Staff members</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">
                Staff can only sign in using your shop URL and can access POS Terminal, Receipts, and Live Orders.
            </p>

            <form onSubmit={handleCreate} className="space-y-4 max-w-md mb-10">
                <h3 className="text-sm font-medium text-gray-800 flex items-center gap-2">
                    <Plus size={16} />
                    Add staff member
                </h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        required
                        autoComplete="off"
                        className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black sm:text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temporary password</label>
                    <div className="relative">
                        <input
                            type={showCreatePassword ? 'text' : 'password'}
                            required
                            minLength={8}
                            autoComplete="new-password"
                            className="w-full text-black pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black sm:text-sm"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            onClick={() => setShowCreatePassword((v) => !v)}
                            aria-label={showCreatePassword ? 'Hide password' : 'Show password'}
                        >
                            {showCreatePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                    <input
                        type="text"
                        className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black sm:text-sm"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Front counter"
                    />
                </div>
                <button
                    type="submit"
                    disabled={busy}
                    className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
                >
                    {busy ? 'Saving…' : 'Create staff account'}
                </button>
            </form>

            <div>
                <h3 className="text-sm font-medium text-gray-800 mb-3">Current staff</h3>
                {staff.length === 0 ? (
                    <p className="text-sm text-gray-500">No staff members yet.</p>
                ) : (
                    <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                        {staff.map((member) => (
                            <li
                                key={member.id}
                                className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50/50 hover:bg-gray-50"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{member.email}</p>
                                    {member.notes && (
                                        <p className="text-xs text-gray-500 truncate">{member.notes}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => openView(member)}
                                        className="p-2 text-gray-700 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                                        title="View details"
                                        aria-label={`View details for ${member.email}`}
                                    >
                                        <CircleUser size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => handleDelete(member.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                        aria-label={`Remove ${member.email}`}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Drawer
                isOpen={drawerOpen}
                onClose={closeDrawer}
                title={panelMode === 'view' ? 'Staff details' : 'Edit staff member'}
                showCloseButton
            >
                {selected && (
                    <div className="p-5 max-w-lg mx-auto w-full">
                        {panelMode === 'view' ? (
                            <div className="space-y-4">
                                <dl className="space-y-3 text-sm">
                                    <div>
                                        <dt className="text-gray-500 font-medium">Email</dt>
                                        <dd className="text-gray-900 mt-0.5 break-all">{selected.email}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500 font-medium">Notes</dt>
                                        <dd className="text-gray-900 mt-0.5">
                                            {selected.notes?.trim() ? selected.notes : '—'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500 font-medium">Role</dt>
                                        <dd className="text-gray-900 mt-0.5">Staff (POS and Live Orders)</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500 font-medium">Added</dt>
                                        <dd className="text-gray-900 mt-0.5">{formatCreatedAt(selected.createdAt)}</dd>
                                    </div>
                                </dl>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditNewPassword(false);
                                            setPanelMode('edit');
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800"
                                    >
                                        <Pencil size={16} />
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => handleDelete(selected.id)}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
                                    >
                                        <Trash2 size={16} />
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveEdit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black sm:text-sm"
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                    <input
                                        type="text"
                                        className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black sm:text-sm"
                                        value={editNotes}
                                        onChange={(e) => setEditNotes(e.target.value)}
                                        placeholder="e.g. Front counter"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        New password <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showEditNewPassword ? 'text' : 'password'}
                                            minLength={8}
                                            autoComplete="new-password"
                                            className="w-full text-black pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black sm:text-sm"
                                            value={editNewPassword}
                                            onChange={(e) => setEditNewPassword(e.target.value)}
                                            placeholder="Leave blank to keep current password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            onClick={() => setShowEditNewPassword((v) => !v)}
                                            aria-label={showEditNewPassword ? 'Hide new password' : 'Show new password'}
                                        >
                                            {showEditNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <button
                                        type="submit"
                                        disabled={busy}
                                        className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
                                    >
                                        {busy ? 'Saving…' : 'Save changes'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPanelMode('view');
                                            setEditEmail(selected.email);
                                            setEditNotes(selected.notes ?? '');
                                            setEditNewPassword('');
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </Drawer>
        </section>
    );
}
