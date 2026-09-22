import React, { useState } from 'react';
import FilterBar, { getDefaultDates } from '../components/overview/FilterBar';
import KPICards from '../components/overview/KPICards';
import WeeklyTrendChart from '../components/overview/WeeklyTrendChart';
import StockDistributionChart from '../components/overview/StockDistributionChart';
import TransactionByUnitChart from '../components/overview/TransactionByUnitChart';
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
export default function Overview() {
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
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-4 rounded-full bg-indigo-500" />
                        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                            Visualisasi &amp; Analitik
                        </h3>
                    </div>

                    <div className="space-y-5">
                        {/* A — Tren Transaksi Mingguan (full width) */}
                        <WeeklyTrendChart filters={filters} />

                        {/* B + C — Side by side (responsive) */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                            <StockDistributionChart filters={filters} />
                            <TransactionByUnitChart filters={filters} />
                        </div>
                    </div>
                </div>

                {/* ── Lihat Selengkapnya Button ──────────── */}
                <div className="flex justify-center pt-2 pb-6">
                    <button
                        id="lihat-selengkapnya-btn"
                        className="group flex items-center gap-3 px-8 py-3.5 rounded-2xl border-2 border-amber-300 bg-white hover:bg-amber-50 hover:border-amber-500 text-amber-700 font-bold text-sm transition-all duration-200 shadow-sm hover:shadow-amber-100 hover:shadow-md active:scale-95"
                    >
                        <BarChart2 className="w-4 h-4" />
                        Lihat Selengkapnya
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                </div>

            </div>
        </div>
    );
}
