import React, { useState } from 'react';
import {
    User,
    Lock,
    Eye,
    EyeOff,
    LogIn,
    UserPlus,
    CreditCard,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import smartLogo from '../assets/LOGO.png';

export default function Login({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);

    // Form states - Login
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    // Form states - Register
    const [regFullName, setRegFullName] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Status message
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!loginUsername.trim() || !loginPassword) {
            setMessage({ type: 'error', text: 'Silakan isi username dan password Anda.' });
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            // Notify parent (App.jsx) that login succeeded
            if (onLogin) {
                onLogin({
                    username: loginUsername,
                    fullName: loginUsername,
                    role: 'Operator',
                });
            } else {
                setMessage({ type: 'success', text: `Selamat datang kembali, ${loginUsername}!` });
            }
        }, 800);
    };

    const handleRegisterSubmit = (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!regFullName.trim() || !regUsername.trim() || !regPassword || !regConfirmPassword) {
            setMessage({ type: 'error', text: 'Harap lengkapi semua data pendaftaran.' });
            return;
        }

        if (regPassword !== regConfirmPassword) {
            setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok.' });
            return;
        }

        if (regPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password minimal 6 karakter.' });
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setMessage({ type: 'success', text: 'Akun berhasil didaftarkan! Silakan masuk.' });
            setTimeout(() => {
                setIsLogin(true);
                setLoginUsername(regUsername);
                setMessage({ type: 'success', text: 'Akun berhasil dibuat. Silakan masukkan password.' });
            }, 1000);
        }, 800);
    };

    const switchMode = (loginMode) => {
        setIsLogin(loginMode);
        setMessage({ type: '', text: '' });
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#FFFDF7]">

            {/* Main Card Container */}
            <div className="w-full max-w-[410px] relative z-10">
                {/* Card */}
                <div className="bg-white/95 backdrop-blur-xl border border-amber-200/80 rounded-3xl p-5 transition-all duration-300">

                    {/* Header Brand Section */}
                    <div className="flex flex-col items-center text-center mb-3">
                        {/* Logo Container */}
                        <div className="mb-2">
                            <img
                                src={smartLogo}
                                alt="PT. SMART Tbk."
                                className="w-12 h-12 object-contain"
                            />
                        </div>

                        {/* Titles */}
                        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
                            SORS
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                            Smart Oil Reconciliation System
                        </p>
                    </div>


                    {/* Feedback Alert */}
                    {message.text && (
                        <div className={`mb-5 p-3 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 transition-all ${message.type === 'error'
                            ? 'bg-red-50 border border-red-200 text-red-700'
                            : 'bg-amber-50 border border-amber-300 text-amber-900'
                            }`}>
                            {message.type === 'error' ? (
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            )}
                            <span className="font-medium">{message.text}</span>
                        </div>
                    )}

                    {/* ===================== FORM LOGIN ===================== */}
                    {isLogin ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-3">
                            {/* Username Field */}
                            <div>
                                <label className="block text-xs font-bold tracking-wider text-slate-700 uppercase mb-1.5">
                                    USERNAME
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        value={loginUsername}
                                        onChange={(e) => setLoginUsername(e.target.value)}
                                        placeholder="Masukkan username"
                                        className="w-full pl-10 pr-4 py-2 bg-amber-50/30 border border-amber-200/80 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-200/50 transition-all"
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-xs font-bold tracking-wider text-slate-700 uppercase mb-1.5">
                                    PASSWORD
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type={showLoginPassword ? 'text' : 'password'}
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        placeholder="Masukkan password"
                                        className="w-full pl-10 pr-11 py-2 bg-amber-50/30 border border-amber-200/80 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-200/50 transition-all"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-amber-600 transition-colors focus:outline-none"
                                        aria-label="Toggle password visibility"
                                    >
                                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full mt-1 py-2.5 px-4 rounded-xl font-bold text-sm text-slate-900 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <LogIn className="w-4 h-4 stroke-[2.5]" />
                                        <span>Masuk</span>
                                    </>
                                )}
                            </button>

                            {/* Switch to Register Link */}
                            <div className="text-center pt-2">
                                <p className="text-xs sm:text-sm text-slate-600">
                                    Belum memiliki akun?{' '}
                                    <button
                                        type="button"
                                        onClick={() => switchMode(false)}
                                        className="font-bold text-amber-600 hover:text-amber-700 underline underline-offset-2 transition-colors cursor-pointer"
                                    >
                                        Daftar di sini
                                    </button>
                                </p>
                            </div>
                        </form>
                    ) : (
                        /* ===================== FORM REGISTER ===================== */
                        <form onSubmit={handleRegisterSubmit} className="space-y-3">
                            {/* Nama Lengkap Field */}
                            <div>
                                <label className="block text-xs font-bold tracking-wider text-slate-700 uppercase mb-1.5">
                                    NAMA LENGKAP
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        value={regFullName}
                                        onChange={(e) => setRegFullName(e.target.value)}
                                        placeholder="Nama lengkap Anda"
                                        className="w-full pl-10 pr-4 py-2.5 bg-amber-50/30 border border-amber-200/80 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-200/50 transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Username Baru Field */}
                            <div>
                                <label className="block text-xs font-bold tracking-wider text-slate-700 uppercase mb-1.5">
                                    USERNAME
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        value={regUsername}
                                        onChange={(e) => setRegUsername(e.target.value)}
                                        placeholder="Username baru"
                                        className="w-full pl-10 pr-4 py-2.5 bg-amber-50/30 border border-amber-200/80 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-200/50 transition-all shadow-sm"
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-xs font-bold tracking-wider text-slate-700 uppercase mb-1.5">
                                    PASSWORD
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type={showRegPassword ? 'text' : 'password'}
                                        value={regPassword}
                                        onChange={(e) => setRegPassword(e.target.value)}
                                        placeholder="Password"
                                        className="w-full pl-10 pr-11 py-2 bg-amber-50/30 border border-amber-200/80 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-200/50 transition-all"
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowRegPassword(!showRegPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-amber-600 transition-colors focus:outline-none"
                                        aria-label="Toggle password visibility"
                                    >
                                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Konfirmasi Password Field */}
                            <div>
                                <label className="block text-xs font-bold tracking-wider text-slate-700 uppercase mb-1.5">
                                    KONFIRMASI PASSWORD
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={regConfirmPassword}
                                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                                        placeholder="Ketik ulang password"
                                        className="w-full pl-10 pr-11 py-2 bg-amber-50/30 border border-amber-200/80 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-200/50 transition-all"
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-amber-600 transition-colors focus:outline-none"
                                        aria-label="Toggle password visibility"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Register Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full mt-1 py-2.5 px-4 rounded-xl font-bold text-sm text-slate-900 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4 stroke-[2.5]" />
                                        <span>Daftar Akun Baru</span>
                                    </>
                                )}
                            </button>

                            {/* Switch to Login Link */}
                            <div className="text-center pt-2">
                                <p className="text-xs sm:text-sm text-slate-600">
                                    Sudah punya akun?{' '}
                                    <button
                                        type="button"
                                        onClick={() => switchMode(true)}
                                        className="font-bold text-amber-600 hover:text-amber-700 underline underline-offset-2 transition-colors cursor-pointer"
                                    >
                                        Masuk di sini
                                    </button>
                                </p>
                            </div>
                        </form>
                    )}

                    {/* Footer Copyright */}
                    <div className="mt-5 pt-3 border-t border-amber-100 text-center">
                        <p className="text-[11px] text-slate-400 font-medium">
                            © 2026 PT. SMART Tbk. All rights reserved.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
