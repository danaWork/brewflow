'use client';

import { useState } from 'react';
import { loginAction } from '@/app/actions/auth';
import { Coffee, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        const result = await loginAction(formData);
        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <header className="p-4 sm:p-6 flex items-center gap-4 relative z-10">
                <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors p-2 -ml-2">
                    <ArrowLeft size={20} />
                </Link>
                <a href='/'><span className="text-xl font-bold text-[#D46215] tracking-tight">BrewFlow</span></a>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 -mt-12 sm:-mt-20">
                <div className="w-full max-w-[440px] bg-[#F9FAFB]/50 border border-gray-100 rounded-[24px] sm:rounded-[32px] p-6 sm:p-10 shadow-sm transition-all">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                            <Coffee className="text-[#D46215]" size={24} />
                        </div>

                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
                        <p className="text-gray-500 text-xs sm:text-sm mb-6 sm:mb-10">
                            Enter your credentials to access your shop dashboard
                        </p>

                        <form onSubmit={handleSubmit} className="w-full space-y-4 sm:space-y-6">
                            <div className="space-y-1.5 text-left">
                                <label className="text-xs sm:text-sm font-semibold text-gray-700 ml-1">Username</label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="Enter username"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#D46215] transition-all"
                                />
                            </div>

                            <div className="space-y-1.5 text-left">
                                <label className="text-xs sm:text-sm font-semibold text-gray-700 ml-1">Password</label>
                                <div className="relative">
                                    <input
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        placeholder="Enter password"
                                        className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-11 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#D46215] transition-all"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowPassword((v) => !v)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="text-red-500 text-[10px] sm:text-xs font-medium text-center bg-red-50 py-2 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <button
                                disabled={loading}
                                className="w-full bg-[#D46215] hover:bg-[#B75311] text-white font-bold py-3 sm:py-3.5 rounded-xl shadow-sm transition-all flex items-center justify-center active:scale-[0.98]"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    'Login'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 sm:mt-8 text-xs sm:text-sm">
                            <span className="text-gray-400">Don't have a shop yet? </span>
                            <button className="text-[#D46215] font-semibold hover:underline">
                                Start Trial
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
