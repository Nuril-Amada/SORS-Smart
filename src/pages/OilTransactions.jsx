import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { OilTransactionsPage } from '../components/overview/OilTransactions';

/* ─────────────────────────────────────────
   Halaman route '/detail-transaksi'.

   - Filter yang sedang aktif di widget Overview (tankSearch, product,
     dateFrom, dateTo) dikirim lewat navigate('/detail-transaksi', { state: filters })
     dari pages/Overview.jsx, dan dibaca di sini lewat useLocation().state.
   - Data transaksi lengkap di-fetch di sini (bukan di komponen presentational
     OilTransactionsPage), sama seperti pola KPI/chart lain di Overview.
───────────────────────────────────────── */
export default function OilTransactions({ onBack }) {
    const location = useLocation();
    // location.state berisi filter yang dioper dari widget Overview, atau
    // null kalau halaman ini dibuka langsung (refresh / akses URL langsung).
    const initialFilters = location.state ?? null;

    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        // TODO: sambungkan ke API asli setelah backend & database siap, contoh:
        //
        // fetch('/api/transaksi')
        //     .then(r => r.json())
        //     .then(setTransactions)
        //     .catch(err => {
        //         console.error('Gagal memuat data transaksi:', err);
        //         setTransactions([]);
        //     });
        //
        // Untuk sekarang dikosongkan supaya halaman menampilkan EmptyState,
        // bukan data dummy/palsu.
        setTransactions([]);
    }, []);

    return (
        <OilTransactionsPage
            onBack={onBack}
            initialFilters={initialFilters}
            transactions={transactions}
        />
    );
}