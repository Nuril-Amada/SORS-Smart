import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, Lock, LogOut,
    Eye, EyeOff, X, Check, AlertCircle
} from 'lucide-react';
import smartLogo from '../assets/LOGO.png';

/* ─────────────────────────────────────────
   Change Password Modal (internal)
───────────────────────────────────────── */
function ChangePasswordModal({ username, onClose }) {
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [loading, setLoading] = useState(false);

    const fields = [
        { label: 'Password Saat Ini', val: currentPass, set: setCurrentPass, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
        { label: 'Password Baru', val: newPass, set: setNewPass, show: showNew, toggle: () => setShowNew(v => !v) },
        { label: 'Konfirmasi Password Baru', val: confirmPass, set: setConfirmPass, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus({ type: '', msg: '' });
        if (!currentPass || !newPass || !confirmPass) {
            setStatus({ type: 'error', msg: 'Semua field wajib diisi.' });
            return;
        }
        if (newPass.length < 6) {
            setStatus({ type: 'error', msg: 'Password baru minimal 6 karakter.' });
            return;
        }
        if (newPass !== confirmPass) {
            setStatus({ type: 'error', msg: 'Konfirmasi password tidak cocok.' });
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setStatus({ type: 'success', msg: 'Password berhasil diperbarui.' });
            setTimeout(onClose, 1200);
        }, 900);
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-amber-100">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-amber-100 bg-gradient-to-r from-[#FFFDF7] to-amber-50/60">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                            <Lock className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 text-sm">Ganti Password</h2>
                            <p className="text-[11px] text-slate-500">{username}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
                    {/* Status Alert */}
                    {status.msg && (
                        <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium border ${status.type === 'error'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                            {status.type === 'error'
                                ? <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                : <Check className="w-3.5 h-3.5 shrink-0" />}
                            {status.msg}
                        </div>
                    )}

                    {/* Fields */}
                    {fields.map(({ label, val, set, show, toggle }) => (
                        <div key={label}>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                {label}
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
                                <input
                                    type={show ? 'text' : 'password'}
                                    value={val}
                                    onChange={e => set(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-9 pr-9 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all bg-slate-50/60"
                                />
                                <button
                                    type="button"
                                    onClick={toggle}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 transition-colors"
                                >
                                    {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Actions */}
                    <div className="flex gap-2.5 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                            {loading
                                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : 'Simpan Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   Navbar (Warna Cream agak kuning disesuaikan)
───────────────────────────────────────── */
export default function Navbar({ user, onLogout }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const displayName = user?.fullName || user?.username || 'Budi Santoso';
    const initials = displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#FAF6EB] via-[#FFFDF8] to-[#FAF5E8] border-b border-amber-200/80 shadow-sm backdrop-blur-md">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

                    {/* ── Left: Logo + Title ── */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 w-9 h-9 rounded-xl bg-white border border-amber-300/80 shadow-xs flex items-center justify-center">
                            <img src={smartLogo} alt="PT SMART Tbk." className="w-6 h-6 object-contain" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-slate-800 font-bold text-sm sm:text-[15px] leading-snug truncate tracking-tight">
                                Dashboard Monitoring Transaksi Minyak
                            </h1>
                            <p className="text-amber-800/80 text-[10px] font-semibold hidden sm:block tracking-wide">
                                SORS — Smart Oil Reconciliation System · PT. SMART Tbk.
                            </p>
                        </div>
                    </div>

                    {/* ── Right: User Dropdown ── */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        <div className="relative" ref={dropdownRef}>
                            <button
                                id="navbar-user-btn"
                                onClick={() => setDropdownOpen(v => !v)}
                                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-amber-300/70 bg-white/80 hover:bg-white hover:border-amber-400 transition-all duration-150 shadow-xs cursor-pointer"
                            >
                                {/* Avatar */}
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white text-[11px] font-black shadow-xs select-none">
                                    {initials}
                                </div>
                                {/* Name + Role */}
                                <div className="hidden sm:block text-left">
                                    <p className="text-slate-800 text-[12px] font-bold leading-tight">{displayName}</p>
                                    <p className="text-amber-800/70 text-[10px] font-medium leading-tight">{user?.role || 'Super Admin'}</p>
                                </div>
                                <ChevronDown
                                    className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-amber-200/80 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                                    {/* User info header */}
                                    <div className="px-4 py-3 bg-gradient-to-br from-[#FFFDF7] to-amber-50/70 border-b border-amber-100">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-black text-sm select-none shadow-xs">
                                                {initials}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 leading-tight">{displayName}</p>
                                                <p className="text-[11px] text-amber-800/80 font-medium">{user?.role || 'Super Admin'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu items */}
                                    <div className="py-1">
                                        <button
                                            id="change-password-btn"
                                            onClick={() => { setShowChangePassword(true); setDropdownOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition-colors text-left cursor-pointer"
                                        >
                                            <Lock className="w-4 h-4 text-amber-600" />
                                            <span className="font-medium">Ganti Password</span>
                                        </button>
                                    </div>

                                    <div className="border-t border-slate-100" />

                                    <div className="py-1">
                                        <button
                                            id="logout-btn"
                                            onClick={() => { setDropdownOpen(false); onLogout(); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span className="font-medium">Keluar</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Change Password Modal */}
            {showChangePassword && (
                <ChangePasswordModal
                    username={displayName}
                    onClose={() => setShowChangePassword(false)}
                />
            )}
        </>
    );
}
