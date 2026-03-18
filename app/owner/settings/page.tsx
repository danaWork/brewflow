'use client';

import { useState } from 'react';
import { updateDashboardPassword, updateDashboardEmail } from '@/app/actions/owner';
import { toast } from 'sonner';
import { KeyRound, Save, Eye, EyeOff, Mail } from 'lucide-react';

export default function OwnerSettingsPage() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newEmail, setNewEmail] = useState('');
    const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
    const [showEmailCurrentPassword, setShowEmailCurrentPassword] = useState(false);
    const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingEmail(true);
        const result = await updateDashboardEmail(newEmail, emailCurrentPassword);
        if (result.success) {
            toast.success('Email updated successfully');
            setNewEmail('');
            setEmailCurrentPassword('');
        } else {
            toast.error(result.error || 'Failed to update email');
        }
        setIsSubmittingEmail(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        setIsSubmitting(true);
        const result = await updateDashboardPassword(currentPassword, newPassword);
        
        if (result.success) {
            toast.success('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            toast.error(result.error || 'Failed to update password');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Restaurant Settings</h1>
            <p className="text-gray-500 mb-8">Configure your restaurant details and security settings</p>

            <div className="grid grid-cols-1 gap-8">
                {/* Change Email Section */}
                <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Mail className="w-5 h-5 text-gray-700" />
                        <h2 className="text-lg font-semibold text-gray-900">Change Email</h2>
                    </div>
                    
                    <form onSubmit={handleEmailSubmit} className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                New Email Address
                            </label>
                            <input
                                type="email"
                                required
                                className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showEmailCurrentPassword ? 'text' : 'password'}
                                    required
                                    className="w-full text-black pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm"
                                    value={emailCurrentPassword}
                                    onChange={(e) => setEmailCurrentPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                    onClick={() => setShowEmailCurrentPassword(!showEmailCurrentPassword)}
                                >
                                    {showEmailCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmittingEmail}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            {isSubmittingEmail ? 'Updating...' : 'Update Email'}
                        </button>
                    </form>
                </section>

                {/* Change Password Section */}
                <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <KeyRound className="w-5 h-5 text-gray-700" />
                    <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                required
                                className="w-full text-black pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                required
                                className="w-full text-black pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                className="w-full text-black pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        {isSubmitting ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </section>
            </div>
        </div>
    );
}
