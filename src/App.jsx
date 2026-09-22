import React, { useState, useEffect } from 'react';
import Login from './pages/login';
import Navbar from './pages/Navbar';
import Overview from './pages/Overview';

/* ─────────────────────────────────────────────────────────────
   Lightweight, robust path-based router
   Mendukung routing URL:
   - /login     -> Tampil halaman Login
   - /overview  -> Tampil halaman Overview (+ Navbar)
   - / (root)   -> Default ke /overview
───────────────────────────────────────────────────────────── */
export default function App() {
  const [currentPath, setCurrentPath] = useState(() => {
    const path = window.location.pathname;
    return path === '/login' ? '/login' : '/overview';
  });

  const [user, setUser] = useState({
    username: 'admin',
    fullName: 'Nuril',
    role: 'Super Admin',
  });

  // Sinkronisasi dengan tombol back/forward browser atau pergantian URL
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      setCurrentPath(path === '/login' ? '/login' : '/overview');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const handleLogin = (userData) => {
    setUser(userData || {
      username: 'admin',
      fullName: 'Nuril',
      role: 'Super Admin',
    });
    navigateTo('/overview');
  };

  const handleLogout = () => {
    setUser(null);
    navigateTo('/login');
  };

  // Jika URL adalah /login -> Tampilkan halaman Login
  if (currentPath === '/login') {
    return <Login onLogin={handleLogin} />;
  }

  // Jika URL adalah /overview atau lainnya -> Tampilkan Overview
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} onLogout={handleLogout} />
      <Overview />
    </div>
  );
}
