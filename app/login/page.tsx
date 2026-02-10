'use client';

import { useState } from 'react';
import { loginAction, seedAction } from '@/app/actions/auth';
import { Coffee, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 selection:bg-orange-500/30">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-md relative">
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative">
                        <div className="flex justify-center mb-8">
                            <div className="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/20 group-hover:scale-110 transition-transform duration-500">
                                <Coffee className="w-8 h-8 text-orange-500" />
                            </div>
                        </div>

                        <div className="text-center mb-10">
                            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">BrewFlow</h1>
                            <p className="text-white/40 font-medium">Internal Management Access</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-white/50 uppercase tracking-widest pl-1">Email Address</label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="name@brewflow.com"
                                    className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.08] transition-all duration-300"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-white/50 uppercase tracking-widest pl-1">Password</label>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.08] transition-all duration-300"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm py-3 px-4 rounded-xl animate-shake">
                                    {error}
                                </div>
                            )}

                            <button
                                disabled={loading}
                                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-900/50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 group/btn transition-all duration-300"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-white/5 text-center">
                            <button
                                onClick={async () => {
                                    const res = await seedAction();
                                    alert(res.message);
                                }}
                                className="text-white/30 hover:text-orange-500/50 text-xs font-medium transition-colors"
                            >
                                Initialize Database (Seed)
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-center mt-8 text-white/20 text-xs tracking-widest uppercase">
                    &copy; 2026 Brewflow Systems
                </p>
            </div>
        </div>
    );
}
