'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Users, Trash2, Plus } from 'lucide-react';
import {
    createStaffMember,
    deleteStaffMember,
    type StaffMemberRow,
} from '@/app/actions/owner';

type Props = {
    initialStaff: StaffMemberRow[];
};

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

    const refresh = () => {
        router.refresh();
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
            refresh();
        } else {
            toast.error(result.error || 'Could not remove staff');
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
                    <input
                        type="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black sm:text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
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
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => handleDelete(member.id)}
                                    className="shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                    aria-label={`Remove ${member.email}`}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
