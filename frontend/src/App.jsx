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
import UserManagement from './pages/UserManagement';

/* ─────────────────────────────────────────
   Layout untuk halaman yang WAJIB login.
   Kalau user belum login (null) -> redirect ke /login.
───────────────────────────────────────── */
function ProtectedLayout({ user, onLogout, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <Navbar user={user} onLogout={onLogout} />
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────
   Route /login
   Kalau user SUDAH login -> langsung lempar ke /overview
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
   Route /user-management (Khusus Admin)
───────────────────────────────────────── */
function UserManagementRoute({ user, onLogout }) {
  const navigate = useNavigate();
  if (user && String(user.role).toLowerCase() !== 'admin') {
    return <Navigate to="/overview" replace />;
  }
  return (
    <ProtectedLayout user={user} onLogout={onLogout}>
      <UserManagement currentUser={user} onBack={() => navigate('/overview')} />
    </ProtectedLayout>
  );
}

/* ─────────────────────────────────────────
   App
───────────────────────────────────────── */
export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sors_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('sors_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('sors_user');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sors_user');
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route
          path="/login"
          element={<LoginRoute user={user} onLogin={handleLogin} />}
        />

        {/* Overview */}
        <Route
          path="/overview"
          element={<OverviewRoute user={user} onLogout={handleLogout} />}
        />

        {/* Detail Transaksi Minyak */}
        <Route
          path="/detail-transaksi"
          element={<OilTransactionsRoute user={user} onLogout={handleLogout} />}
        />
        <Route
          path="/transactions"
          element={<Navigate to="/detail-transaksi" replace />}
        />

        {/* Master Data User (Admin only) */}
        <Route
          path="/user-management"
          element={<UserManagementRoute user={user} onLogout={handleLogout} />}
        />

        {/* Path lain -> overview kalau login, login kalau belum */}
        <Route
          path="*"
          element={<Navigate to={user ? '/overview' : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}