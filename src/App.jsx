import React, { useState, useEffect } from 'react';
import Login from './pages/login';
import Navbar from './pages/Navbar';
import Overview from './pages/Overview';
import OilTransactions from './pages/OilTransactions';

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => {
    const path = window.location.pathname;
    if (path === '/login') return '/login';
    if (path === '/detail-transaksi' || path === '/transactions') return '/detail-transaksi';
    return '/overview';
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
      if (path === '/login') setCurrentPath('/login');
      else if (path === '/detail-transaksi' || path === '/transactions') setCurrentPath('/detail-transaksi');
      else setCurrentPath('/overview');
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

  // Jika URL adalah /detail-transaksi -> Tampilkan Halaman Detail Transaksi Minyak + Navbar
  if (currentPath === '/detail-transaksi' || currentPath === '/transactions') {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar user={user} onLogout={handleLogout} />
        <OilTransactions onBack={() => navigateTo('/overview')} />
      </div>
    );
  }

  // Default: Tampilkan Overview + Navbar
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} onLogout={handleLogout} />
      <Overview onNavigate={navigateTo} />
    </div>
  );
}
