import React, { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';

import Login from './pages/login';
import Navbar from './pages/Navbar';
import Overview from './pages/Overview';
import OilTransactions from './pages/OilTransactions';

/* ─────────────────────────────────────────
   Layout untuk halaman yang WAJIB login.
   Kalau user belum login (null) -> redirect ke /login.
───────────────────────────────────────── */
function ProtectedLayout({ user, onLogout, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} onLogout={onLogout} />
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────
   Route /login
   Kalau user SUDAH login -> langsung lempar ke /overview
   (biar tidak bisa balik ke halaman login lagi setelah login).
───────────────────────────────────────── */
function LoginRoute({ user, onLogin }) {
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/overview" replace />;
  }

  return (
    <Login
      onLogin={(userData) => {
        onLogin(userData);
        navigate('/overview');
      }}
    />
  );
}

/* ─────────────────────────────────────────
   Route /overview
───────────────────────────────────────── */
function OverviewRoute({ user, onLogout }) {
  const navigate = useNavigate();
  return (
    <ProtectedLayout user={user} onLogout={onLogout}>
      {/*
        onNavigate menerima 2 argumen: path, dan filter tabel yang sedang
        aktif di widget OilTransactionDetail (lihat handleViewAllTransactions
        di Overview.jsx). Filter dioper lewat `state` react-router, dan
        dibaca kembali di pages/OilTransactions.jsx via useLocation().state.
      */}
      <Overview onNavigate={(path, filters) => navigate(path, { state: filters })} />
    </ProtectedLayout>
  );
}

/* ─────────────────────────────────────────
   Route /detail-transaksi
───────────────────────────────────────── */
function OilTransactionsRoute({ user, onLogout }) {
  const navigate = useNavigate();
  return (
    <ProtectedLayout user={user} onLogout={onLogout}>
      <OilTransactions onBack={() => navigate('/overview')} />
    </ProtectedLayout>
  );
}

/* ─────────────────────────────────────────
   App
───────────────────────────────────────── */
export default function App() {
  // Ganti default ini kalau nanti login sudah terhubung ke backend beneran —
  // idealnya user awalnya `null` (belum login) sampai handleLogin dipanggil.
  const [user, setUser] = useState({
    username: 'admin',
    fullName: 'Nuril',
    role: 'Super Admin',
  });

  const handleLogin = (userData) => {
    setUser(
      userData || {
        username: 'admin',
        fullName: 'Nuril',
        role: 'Super Admin',
      }
    );
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route
          path="/login"
          element={<LoginRoute user={user} onLogin={handleLogin} />}
        />

        {/* Overview (default halaman utama setelah login) */}
        <Route
          path="/overview"
          element={<OverviewRoute user={user} onLogout={handleLogout} />}
        />

        {/* Detail Transaksi Minyak */}
        <Route
          path="/detail-transaksi"
          element={<OilTransactionsRoute user={user} onLogout={handleLogout} />}
        />
        {/* Alias lama /transactions tetap diarahkan ke /detail-transaksi */}
        <Route
          path="/transactions"
          element={<Navigate to="/detail-transaksi" replace />}
        />

        {/* Path lain (termasuk "/") -> overview kalau login, login kalau belum */}
        <Route
          path="*"
          element={<Navigate to={user ? '/overview' : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}