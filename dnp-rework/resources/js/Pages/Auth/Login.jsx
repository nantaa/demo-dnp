import React, { useEffect, useState } from 'react';
import { useForm, Head, Link, router, usePage } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';
import { showError } from '@/swal';

// Reusable concentric arc "ulir/thread" decoration
// origin: 'tl' | 'tr' | 'bl' | 'br' controls which corner the arcs radiate from
function ThreadDecor({ size = 220, color = '#00A8E8', opacity = 0.18, origin = 'br', count = 8, strokeWidth = 1.5 }) {
    const arcs = [];
    const step = size / count;
    for (let i = 1; i <= count; i++) {
        const r = i * step;
        let d = '';
        if (origin === 'br') d = `M ${size} ${size - r} A ${r} ${r} 0 0 0 ${size - r} ${size}`;
        if (origin === 'bl') d = `M 0 ${size - r} A ${r} ${r} 0 0 1 ${r} ${size}`;
        if (origin === 'tr') d = `M ${size - r} 0 A ${r} ${r} 0 0 1 ${size} ${r}`;
        if (origin === 'tl') d = `M ${r} 0 A ${r} ${r} 0 0 0 0 ${r}`;
        arcs.push(
            <path
                key={i}
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={opacity + (i / count) * 0.15}
            />
        );
    }
    return (
        <svg
            viewBox={`0 0 ${size} ${size}`}
            width={size}
            height={size}
            style={{ display: 'block', overflow: 'visible' }}
            aria-hidden="true"
        >
            {arcs}
        </svg>
    );
}

export default function Login({ status, canResetPassword }) {
    const { auth } = usePage().props;
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (auth?.user) {
            router.replace('/');
        }
    }, [auth]);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        setLocalError('');
        post(route('login'), {
            replace: true,
            onFinish: () => reset('password'),
            onSuccess: (page) => {
                // If response succeeds but auth.user is still absent, the login was rejected
                if (!page?.props?.auth?.user) {
                    const fallbackMsg = page?.props?.errors?.email 
                        || page?.props?.errors?.password 
                        || page?.props?.errors?.error 
                        || 'Email atau password yang Anda masukkan tidak sesuai.';
                    setLocalError(fallbackMsg);
                    showError('Gagal Masuk', fallbackMsg);
                }
            },
            onError: (errs) => {
                const msg = errs?.email || errs?.password || errs?.error || 'Email atau password yang Anda masukkan tidak sesuai.';
                setLocalError(msg);
                showError('Gagal Masuk', msg);
            },
        });
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden font-sans"
            style={{ background: 'linear-gradient(135deg, #0A1F3A 0%, #0A385C 50%, #063970 100%)' }}
        >
            <Head title="Log in - PT Delta Nusantara Persada" />

            {/* Thread / Ulir decorations — top-left corner */}
            <div className="absolute top-0 left-0 pointer-events-none select-none">
                <ThreadDecor size={320} color="#00A8E8" opacity={0.12} origin="tl" count={10} strokeWidth={1.5} />
            </div>

            {/* Thread / Ulir decorations — bottom-right corner */}
            <div className="absolute bottom-0 right-0 pointer-events-none select-none">
                <ThreadDecor size={380} color="#00A8E8" opacity={0.10} origin="br" count={12} strokeWidth={1.5} />
            </div>

            {/* Thread / Ulir decorations — bottom-left (smaller, accent) */}
            <div className="absolute bottom-0 left-0 pointer-events-none select-none">
                <ThreadDecor size={180} color="#ffffff" opacity={0.05} origin="bl" count={6} strokeWidth={1} />
            </div>

            {/* Thread / Ulir decorations — top-right (smaller, accent) */}
            <div className="absolute top-0 right-0 pointer-events-none select-none">
                <ThreadDecor size={200} color="#ffffff" opacity={0.05} origin="tr" count={6} strokeWidth={1} />
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-sm mx-auto px-5">

                {/* Logo + Brand above card */}
                <div className="flex flex-col items-center mb-7">
                    <div className="bg-white p-3 rounded-2xl shadow-xl border border-white/20 mb-3 inline-flex items-center justify-center">
                        <img
                            src="/images/logo.png"
                            alt="PT Delta Nusantara Persada"
                            className="h-12 w-auto object-contain"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    </div>
                    <div className="text-center">
                        <div className="text-white font-black text-lg tracking-widest uppercase leading-none">
                            MORIKU APP
                        </div>
                        <div className="text-[#00A8E8] text-[11px] font-semibold tracking-wider mt-1.5 uppercase">
                            Monitoring Riksa Uji · PT Delta Nusantara Persada
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Card top accent */}
                    <div className="h-1 bg-gradient-to-r from-[#0A385C] via-[#00A8E8] to-[#0A385C]" />

                    <div className="px-8 py-8 relative overflow-hidden">
                        {/* Micro thread decoration inside card (very subtle) */}
                        <div className="absolute -top-2 -right-2 pointer-events-none select-none opacity-[0.06]">
                            <ThreadDecor size={130} color="#0A385C" opacity={1} origin="tr" count={7} strokeWidth={2} />
                        </div>

                        <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-6 text-center">
                            Masuk ke akun Anda
                        </p>

                        {status && (
                            <div className="mb-5 text-sm font-medium text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                                {status}
                            </div>
                        )}

                        {(localError || errors.email || errors.password || errors.error) && (
                            <div className="mb-5 text-xs font-semibold text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-200 flex items-start gap-2.5 shadow-xs">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <div className="flex-1 leading-relaxed">
                                    {localError || errors.email || errors.password || errors.error}
                                </div>
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    onChange={(e) => {
                                        setLocalError('');
                                        setData('email', e.target.value);
                                    }}
                                    className={`w-full px-4 py-3 rounded-xl text-sm text-gray-900 focus:outline-none transition-all placeholder:text-slate-300 ${
                                        (localError || errors.email) 
                                            ? 'bg-red-50/50 border border-red-400 focus:ring-2 focus:ring-red-400' 
                                            : 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-[#00A8E8] focus:border-[#00A8E8]'
                                    }`}
                                    placeholder="name@deltaindo.co.id"
                                    required
                                    autoFocus
                                />
                                {errors.email && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2" htmlFor="password">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => {
                                        setLocalError('');
                                        setData('password', e.target.value);
                                    }}
                                    className={`w-full px-4 py-3 rounded-xl text-sm text-gray-900 focus:outline-none transition-all placeholder:text-slate-300 ${
                                        (localError || errors.password) 
                                            ? 'bg-red-50/50 border border-red-400 focus:ring-2 focus:ring-red-400' 
                                            : 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-[#00A8E8] focus:border-[#00A8E8]'
                                    }`}
                                    placeholder="••••••••"
                                    required
                                />
                                {errors.password && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.password}</p>}
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center cursor-pointer gap-2">
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="rounded border-slate-300 text-[#00A8E8] shadow-sm focus:ring-[#00A8E8]"
                                    />
                                    <span className="text-xs text-slate-500 font-medium">Remember me</span>
                                </label>
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-xs text-[#00A8E8] hover:text-[#063970] font-semibold"
                                    >
                                        Lupa password?
                                    </Link>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3 px-4 bg-gradient-to-r from-[#0A385C] to-[#00A8E8] hover:from-[#063970] hover:to-[#0088CC] text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 mt-2"
                            >
                                {processing ? 'Logging in...' : 'LOG IN'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="text-center mt-6 text-[11px] text-white/30">
                    &copy; {new Date().getFullYear()} PT Delta Nusantara Persada. All rights reserved.
                </div>
            </div>
        </div>
    );
}
