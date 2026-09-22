import React, { useState } from 'react';
import FilterBar, { getDefaultDates } from '../components/overview/FilterBar';
import KPICards from '../components/overview/KPICards';
import DailyTrendChart from '../components/overview/DailyTrendChart';
import StockDistributionChart from '../components/overview/StockDistributionChart';
import TransactionByUnitChart from '../components/overview/TransactionByUnitChart';
import OilTransactionDetail from '../components/overview/OilTransactionDetail';
import { ArrowRight, BarChart2 } from 'lucide-react';

/* ─────────────────────────────────────────
   Default filter state: current month
───────────────────────────────────────── */
function buildDefaultFilters() {
    const dates = getDefaultDates();
    return {
        dateFrom: dates.dateFrom,
        dateTo: dates.dateTo,
        product: '',
        cluster: '',
    };
}

/* ─────────────────────────────────────────
   Overview page
───────────────────────────────────────── */
export default function Overview({ onNavigate }) {
    const [filters, setFilters] = useState(buildDefaultFilters);

    const handleResetFilters = () => {
        setFilters(buildDefaultFilters());
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 pt-16">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

                {/* ── Section 1: Filter Container & Action Buttons (Terintegrasi) ── */}
                <FilterBar
                    filters={filters}
                    onFiltersChange={setFilters}
                    onResetFilters={handleResetFilters}
                />

                {/* ── Section 3: KPI Cards ───────────────── */}
                <KPICards filters={filters} />

                {/* ══════════════════════════════════════════
                    Section 4: Visualisasi / Charts
                ══════════════════════════════════════════ */}
                <div>

                    <div className="space-y-5">
                        {/* A — Tren Transaksi Harian (full width) */}
                        <DailyTrendChart filters={filters} />

                        {/* B + C — Side by side (responsive) */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                            <StockDistributionChart filters={filters} />
                            <TransactionByUnitChart filters={filters} />
                        </div>

                        {/* D — Detail Transaksi Minyak (Tabel Detail 5 Teratas & Lihat Selengkapnya) */}
                        <OilTransactionDetail
                            filters={filters}
                            onViewAll={() => onNavigate ? onNavigate('/detail-transaksi') : (window.history.pushState({}, '', '/detail-transaksi'), window.dispatchEvent(new PopStateEvent('popstate')))}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
