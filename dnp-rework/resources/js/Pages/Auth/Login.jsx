import React from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 relative overflow-hidden font-sans">
            <Head title="Log in - PT Delta Nusantara Persada" />

            {/* Background Decorative Waves / Curves (DNP Brand Style) */}
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-r fill-none from-[#063970] via-[#0A385C] to-[#00A8E8] shadow-md z-0 overflow-hidden">
                <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full opacity-30 preserve-3d" preserveAspectRatio="none">
                    <path fill="#ffffff" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,197.3C384,181,480,139,576,144C672,149,768,203,864,218.7C960,235,1056,213,1152,186.7C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
            </div>

            <div className="relative z-10 w-full max-w-md px-6 py-4">
                {/* DNP Logo Box */}
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 mb-3 flex items-center justify-center">
                        <img src="/images/logo.png" alt="DNP Logo" className="h-14 w-auto object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                        <ApplicationLogo className="h-12 w-auto" showText={true} />
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-white/95 backdrop-blur-md px-8 py-8 shadow-xl rounded-2xl border border-slate-100">
                    <div className="mb-6 text-center">
                        <h2 className="text-xl font-bold text-[#0A385C]">MORIKU APP</h2>
                        <p className="text-xs text-gray-500 mt-1">Monitoring Riksa Uji PT Delta Nusantara Persada</p>
                    </div>

                    {status && (
                        <div className="mb-4 text-sm font-medium text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5" htmlFor="email">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#00A8E8] focus:border-[#00A8E8] transition-all"
                                placeholder="name@deltaindo.co.id"
                                required
                                autoFocus
                            />
                            {errors.email && <p className="text-xs text-red-600 mt-1.5">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5" htmlFor="password">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#00A8E8] focus:border-[#00A8E8] transition-all"
                                placeholder="••••••••"
                                required
                            />
                            {errors.password && <p className="text-xs text-red-600 mt-1.5">{errors.password}</p>}
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-gray-300 text-[#00A8E8] shadow-sm focus:ring-[#00A8E8]"
                                />
                                <span className="ml-2 text-xs text-gray-600 font-medium">Remember me</span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-xs text-[#00A8E8] hover:text-[#063970] font-semibold underline underline-offset-2"
                                >
                                    Forgot your password?
                                </Link>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 px-4 bg-gradient-to-r from-[#0A385C] to-[#00A8E8] hover:from-[#063970] hover:to-[#0088CC] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                        >
                            {processing ? 'Logging in...' : 'LOG IN'}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-6 text-xs text-gray-400">
                    &copy; {new Date().getFullYear()} PT Delta Nusantara Persada. All rights reserved.
                </div>
            </div>
        </div>
    );
}
