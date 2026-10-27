import React, { useState, useEffect } from 'react';
import {
    Users, Shield, ShieldAlert, UserPlus, Key, Trash2, Search,
    Check, AlertCircle, X, Lock, Eye, EyeOff, ArrowLeft, RefreshCw
} from 'lucide-react';
import { fetchUsers, createUser, updateUserRole, updateUserPassword, deleteUser } from '../services/api';

/* ─────────────────────────────────────────
   Modal: Tambah User Baru
───────────────────────────────────────── */
function AddUserModal({ onClose, onSuccess }) {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user'); // Default role 'user'
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!fullName.trim() || !username.trim() || !password) {
            setError('Semua field wajib diisi.');
            return;
        }
        if (password.length < 6) {
            setError('Password minimal 6 karakter.');
            return;
        }

        setLoading(true);
        try {
            const res = await createUser({ full_name: fullName, username, password, role });
            onSuccess(res.message || 'User baru berhasil dibuat.');
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Gagal membuat user baru.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                            <UserPlus className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">Tambah User Baru</h3>
                            <p className="text-[11px] text-slate-500">Buat akun user baru & tentukan hak akses</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Nama Lengkap
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            placeholder="Contoh: Budi Santoso"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="Contoh: budi123"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Password Initial
                        </label>
                        <div className="relative">
                            <input
                                type={showPass ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Role / Hak Akses
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setRole('user')}
                                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${role === 'user'
                                    ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                <Shield className="w-3.5 h-3.5" />
                                <span>User (Default)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('admin')}
                                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${role === 'admin'
                                    ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>Admin</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   Modal: Reset / Ganti Password User (By Admin)
───────────────────────────────────────── */
function ChangeUserPasswordModal({ targetUser, onClose, onSuccess }) {
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!password || !confirmPass) {
            setError('Password dan konfirmasi password wajib diisi.');
            return;
        }
        if (password.length < 6) {
            setError('Password minimal 6 karakter.');
            return;
        }
        if (password !== confirmPass) {
            setError('Konfirmasi password tidak cocok.');
            return;
        }

        setLoading(true);
        try {
            const res = await updateUserPassword(targetUser.id, password);
            onSuccess(res.message || `Password untuk user "${targetUser.username}" berhasil diubah.`);
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Gagal mengubah password user.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-amber-50/70">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                            <Key className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">Ganti Password User</h3>
                            <p className="text-[11px] text-amber-800 font-semibold">{targetUser.full_name} ({targetUser.username})</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Password Baru
                        </label>
                        <div className="relative">
                            <input
                                type={showPass ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Konfirmasi Password Baru
                        </label>
                        <input
                            type={showPass ? 'text' : 'password'}
                            value={confirmPass}
                            onChange={e => setConfirmPass(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            {loading ? 'Menyimpan...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   Halaman Utama: User Management (Admin Master Data)
───────────────────────────────────────── */
export default function UserManagement({ onBack }) {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const [showAddModal, setShowAddModal] = useState(false);
    const [passModalUser, setPassModalUser] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await fetchUsers();
            setUsers(data);
        } catch (err) {
            console.error('Error loadUsers:', err);
            showToast('Gagal mengambil data user.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleRoleChange = async (userItem, newRole) => {
        if (userItem.role === newRole) return;
        try {
            await updateUserRole(userItem.id, newRole, userItem.full_name);
            showToast(`Role user "${userItem.username}" berhasil diubah menjadi ${newRole.toUpperCase()}.`, 'success');
            loadUsers();
        } catch (err) {
            showToast(err?.response?.data?.message || err?.message || 'Gagal mengubah role user.', 'error');
        }
    };

    const handleDeleteUser = async (userItem) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus user "${userItem.username}" (${userItem.full_name})?`)) return;
        try {
            await deleteUser(userItem.id);
            showToast(`User "${userItem.username}" berhasil dihapus.`, 'error');
            loadUsers();
        } catch (err) {
            showToast(err?.response?.data?.message || err?.message || 'Gagal menghapus user.', 'error');
        }
    };

    const filteredUsers = users.filter(u => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return u.username.toLowerCase().includes(q) || (u.full_name || '').toLowerCase().includes(q);
    });

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 pt-16">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
                {/* ── Breadcrumb & Top Bar ── */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 font-semibold text-xs transition-all shadow-xs group cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
                        <span>Kembali ke Overview</span>
                    </button>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <span>Overview</span>
                        <span>/</span>
                        <span className="text-amber-800 font-bold">Master Data User</span>
                    </div>
                </div>

                {/* ── Header Card ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-xs">
                                <Users className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h1 className="text-slate-800 font-bold text-lg sm:text-xl tracking-tight">Kelola Data User & Role (Master Data)</h1>
                                <p className="text-slate-500 text-xs mt-0.5">Koordinasikan semua pengguna terdaftar, kelola hak akses (role admin / user), dan atur ulang password.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                            <button
                                onClick={loadUsers}
                                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                                title="Refresh data user"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>

                            <button
                                onClick={() => setShowAddModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>Tambah User Baru</span>
                            </button>
                        </div>
                    </div>

                    {/* Toast Notification */}
                    {toast && (
                        <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold border animate-in fade-in duration-200 ${toast.type === 'error'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                            {toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
                            <span>{toast.message}</span>
                        </div>
                    )}
                </div>

                {/* ── Table Card ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Filter / Search Bar */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Cari nama atau username..."
                                className="w-full pl-9 pr-4 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
                            />
                        </div>
                        <span className="text-xs text-slate-500 font-semibold">Total: {filteredUsers.length} User Terdaftar</span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                                    <th className="py-3 px-4">User</th>
                                    <th className="py-3 px-4">Username</th>
                                    <th className="py-3 px-4">Role / Hak Akses</th>
                                    <th className="py-3 px-4">Tanggal Dibuat</th>
                                    <th className="py-3 px-4 text-center">Aksi / Kontrol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400">
                                            <div className="inline-flex items-center gap-2 text-xs font-semibold">
                                                <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                                                <span>Memuat data user...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400">
                                            <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                            <p className="font-semibold text-slate-600">Tidak ada user ditemukan</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => {
                                        const isAdmin = String(u.role).toLowerCase() === 'admin';
                                        const initials = (u.full_name || u.username || 'U')
                                            .split(' ')
                                            .map(n => n[0])
                                            .join('')
                                            .toUpperCase()
                                            .slice(0, 2);

                                        return (
                                            <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-xs ${isAdmin
                                                            ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
                                                            : 'bg-gradient-to-br from-slate-600 to-slate-700 text-white'
                                                            }`}>
                                                            {initials}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800">{u.full_name || '-'}</p>
                                                            <p className="text-[10px] text-slate-400 font-mono">ID: #{u.id}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4 font-mono font-bold text-slate-700">
                                                    @{u.username}
                                                </td>

                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={u.role}
                                                            onChange={e => handleRoleChange(u, e.target.value)}
                                                            className={`px-2.5 py-1 rounded-xl border text-xs font-bold focus:outline-none cursor-pointer ${isAdmin
                                                                ? 'bg-amber-50 border-amber-200 text-amber-800'
                                                                : 'bg-blue-50 border-blue-200 text-blue-700'
                                                                }`}
                                                        >
                                                            <option value="user">User</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                        {isAdmin && <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />}
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4 text-slate-500 font-medium">
                                                    {u.created_at || '-'}
                                                </td>

                                                <td className="py-3 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setPassModalUser(u)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-200 hover:text-amber-800 text-slate-600 font-bold text-[11px] transition-colors cursor-pointer"
                                                            title="Ganti password user ini"
                                                        >
                                                            <Key className="w-3 h-3 text-amber-600" />
                                                            <span>Ganti Password</span>
                                                        </button>

                                                        {u.username !== 'admin' && (
                                                            <button
                                                                onClick={() => handleDeleteUser(u)}
                                                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                                                title="Hapus user ini"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Tambah User */}
            {showAddModal && (
                <AddUserModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={(msg) => {
                        showToast(msg, 'success');
                        loadUsers();
                    }}
                />
            )}

            {/* Modal Ganti Password User */}
            {passModalUser && (
                <ChangeUserPasswordModal
                    targetUser={passModalUser}
                    onClose={() => setPassModalUser(null)}
                    onSuccess={(msg) => showToast(msg, 'success')}
                />
            )}
        </div>
    );
}
