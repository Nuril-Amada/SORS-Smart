import React, { useState, useMemo, useEffect } from 'react';
import {
    Table, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
    ChevronLeft, ChevronRight, RotateCcw, AlertTriangle,
    RefreshCw, ChevronDown, ChevronUp, Droplets, Thermometer,
    Calendar, Maximize2, Minimize2, Check, X
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   Mock Dataset: Transaksi Minyak Sawit & Turunannya (CPO, Olein, Stearin, dll)
───────────────────────────────────────────────────────────────────────────── */
const INITIAL_TRANSACTIONS = [
    { id: 'TRX-2026-001', date: '2026-09-22 10:45', product: 'CPO', tank: 'Tangki 01', inFlow: 1450.5, outFlow: 0, tempIn: 52.3, tempOut: 55.6 },
    { id: 'TRX-2026-002', date: '2026-09-22 09:15', product: 'RBD Olein', tank: 'Tangki 02', inFlow: 0, outFlow: 820.0, tempIn: 48.0, tempOut: 47.2 },
    { id: 'TRX-2026-003', date: '2026-09-22 07:30', product: 'RBD Stearin', tank: 'Tangki 03', inFlow: 920.0, outFlow: 450.2, tempIn: 61.5, tempOut: 62.1 },
    { id: 'TRX-2026-004', date: '2026-09-21 16:50', product: 'PFAD', tank: 'Tangki 04', inFlow: 650.0, outFlow: 0, tempIn: 58.2, tempOut: 57.5 },
    { id: 'TRX-2026-005', date: '2026-09-21 14:10', product: 'PKO', tank: 'Tangki 05', inFlow: 0, outFlow: 730.4, tempIn: 45.2, tempOut: 45.2 },
    { id: 'TRX-2026-006', date: '2026-09-21 11:25', product: 'CPO', tank: 'Tangki 01', inFlow: 1200.0, outFlow: 600.0, tempIn: 53.0, tempOut: 56.2 },
    { id: 'TRX-2026-007', date: '2026-09-20 15:40', product: 'RBDPO', tank: 'Tangki 06', inFlow: 850.5, outFlow: 400.0, tempIn: 50.1, tempOut: 51.4 },
    { id: 'TRX-2026-008', date: '2026-09-20 13:10', product: 'RBD Olein', tank: 'Tangki 02', inFlow: 1100.0, outFlow: 0, tempIn: 49.5, tempOut: 48.8 },
    { id: 'TRX-2026-009', date: '2026-09-19 16:00', product: 'RBD Stearin', tank: 'Tangki 03', inFlow: 0, outFlow: 550.0, tempIn: 60.8, tempOut: 62.4 },
    { id: 'TRX-2026-010', date: '2026-09-19 10:20', product: 'CPO', tank: 'Tangki 01', inFlow: 1780.0, outFlow: 920.0, tempIn: 51.8, tempOut: 54.9 },
    { id: 'TRX-2026-011', date: '2026-09-18 14:35', product: 'PFAD', tank: 'Tangki 04', inFlow: 420.0, outFlow: 310.0, tempIn: 57.0, tempOut: 56.2 },
    { id: 'TRX-2026-012', date: '2026-09-18 09:05', product: 'PKO', tank: 'Tangki 05', inFlow: 890.0, outFlow: 0, tempIn: 44.8, tempOut: 46.1 },
    { id: 'TRX-2026-013', date: '2026-09-17 15:50', product: 'RBDPO', tank: 'Tangki 06', inFlow: 0, outFlow: 620.0, tempIn: 51.2, tempOut: 50.8 },
    { id: 'TRX-2026-014', date: '2026-09-17 11:15', product: 'CPO', tank: 'Tangki 01', inFlow: 1350.0, outFlow: 0, tempIn: 52.6, tempOut: 55.1 },
    { id: 'TRX-2026-015', date: '2026-09-16 16:20', product: 'RBD Olein', tank: 'Tangki 02', inFlow: 980.0, outFlow: 750.0, tempIn: 48.7, tempOut: 49.3 },
    { id: 'TRX-2026-016', date: '2026-09-16 10:00', product: 'RBD Stearin', tank: 'Tangki 03', inFlow: 650.0, outFlow: 0, tempIn: 62.0, tempOut: 62.5 },
    { id: 'TRX-2026-017', date: '2026-09-15 14:40', product: 'CPO', tank: 'Tangki 01', inFlow: 1600.0, outFlow: 1100.0, tempIn: 52.1, tempOut: 55.4 },
    { id: 'TRX-2026-018', date: '2026-09-15 08:30', product: 'PFAD', tank: 'Tangki 04', inFlow: 0, outFlow: 490.0, tempIn: 58.5, tempOut: 57.1 },
];

const PRODUCT_LIST = ['Semua Produk', 'CPO', 'RBD Olein', 'RBD Stearin', 'PFAD', 'PKO', 'RBDPO'];
const TANK_LIST = ['Semua Tangki', 'Tangki 01', 'Tangki 02', 'Tangki 03', 'Tangki 04', 'Tangki 05', 'Tangki 06'];

const PRODUCT_BADGE_STYLES = {
    'CPO': 'bg-amber-50 text-amber-700 border-amber-200',
    'RBD Olein': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'RBD Stearin': 'bg-orange-50 text-orange-700 border-orange-200',
    'PFAD': 'bg-purple-50 text-purple-700 border-purple-200',
    'PKO': 'bg-blue-50 text-blue-700 border-blue-200',
    'RBDPO': 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function OilTransactionDetail({ filters }) {
    // Mode tampilan: preview (5 teratas) vs full detail
    const [isExpanded, setIsExpanded] = useState(false);

    // Filter & Search states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('Semua Produk');
    const [selectedTank, setSelectedTank] = useState('Semua Tangki');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Sorting states: column ('date', 'inFlow', 'outFlow', 'deltaTemp') & order ('asc' | 'desc')
    const [sortConfig, setSortConfig] = useState({ column: 'date', order: 'desc' });

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Loading and Error simulation states
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState(null);

    // Sinkronisasi filter jika parent menyediakan filter global
    useEffect(() => {
        if (filters?.product) {
            setSelectedProduct(filters.product);
        }
        if (filters?.dateFrom) {
            setDateFrom(filters.dateFrom);
        }
        if (filters?.dateTo) {
            setDateTo(filters.dateTo);
        }
    }, [filters]);

    // Handle sort toggle
    const handleSort = (column) => {
        setSortConfig((prev) => {
            if (prev.column === column) {
                return { column, order: prev.order === 'asc' ? 'desc' : 'asc' };
            }
            return { column, order: 'desc' };
        });
        setCurrentPage(1);
    };

    // Reset filters
    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedProduct('Semua Produk');
        setSelectedTank('Semua Tangki');
        setDateFrom('');
        setDateTo('');
        setSortConfig({ column: 'date', order: 'desc' });
        setCurrentPage(1);
        setApiError(null);
    };

    // Trigger refresh / reload data
    const handleRefresh = () => {
        setIsLoading(true);
        setApiError(null);
        setTimeout(() => {
            setIsLoading(false);
        }, 600);
    };

    // Simulasi Error API untuk demonstrasi requirement error handling
    const triggerSimulatedError = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setApiError('Gagal memuat data transaksi minyak dari server (500 Internal Error). Silakan coba lagi.');
        }, 500);
    };

    // Filter and sort computation
    const filteredAndSortedData = useMemo(() => {
        let result = [...INITIAL_TRANSACTIONS];

        // Search filter
        if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase();
            result = result.filter(
                (item) =>
                    item.product.toLowerCase().includes(query) ||
                    item.tank.toLowerCase().includes(query) ||
                    item.date.includes(query) ||
                    item.id.toLowerCase().includes(query)
            );
        }

        // Product filter
        if (selectedProduct !== 'Semua Produk') {
            result = result.filter((item) => item.product === selectedProduct);
        }

        // Tank filter
        if (selectedTank !== 'Semua Tangki') {
            result = result.filter((item) => item.tank === selectedTank);
        }

        // Date period filter
        if (dateFrom) {
            result = result.filter((item) => item.date.slice(0, 10) >= dateFrom);
        }
        if (dateTo) {
            result = result.filter((item) => item.date.slice(0, 10) <= dateTo);
        }

        // Sorting
        result.sort((a, b) => {
            let valA, valB;
            if (sortConfig.column === 'date') {
                valA = new Date(a.date).getTime();
                valB = new Date(b.date).getTime();
            } else if (sortConfig.column === 'inFlow') {
                valA = a.inFlow;
                valB = b.inFlow;
            } else if (sortConfig.column === 'outFlow') {
                valA = a.outFlow;
                valB = b.outFlow;
            } else if (sortConfig.column === 'deltaTemp') {
                valA = a.tempOut - a.tempIn;
                valB = b.tempOut - b.tempIn;
            } else {
                valA = a[sortConfig.column];
                valB = b[sortConfig.column];
            }

            if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [searchTerm, selectedProduct, selectedTank, dateFrom, dateTo, sortConfig]);

    // Data yang tampil:
    // Jika tidak di-expand (mode preview), cuma 5 teratas.
    // Jika di-expand, ikuti pagination.
    const totalItems = filteredAndSortedData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    const displayedData = useMemo(() => {
        if (!isExpanded) {
            return filteredAndSortedData.slice(0, 5);
        }
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAndSortedData, isExpanded, currentPage, itemsPerPage]);

    // Format helpers
    const formatNumber = (val) => val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const renderSortIcon = (column) => {
        if (sortConfig.column !== column) {
            return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />;
        }
        return sortConfig.order === 'asc' ? (
            <ArrowUp className="w-3.5 h-3.5 text-amber-600 font-bold" />
        ) : (
            <ArrowDown className="w-3.5 h-3.5 text-amber-600 font-bold" />
        );
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
            {/* ── Header Bagian ── */}
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <Droplets className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800 text-sm md:text-base">
                                Detail Transaksi Minyak
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                                {totalItems} Transaksi
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Data rincian aliran minyak masuk/keluar, tangki, dan pemantauan delta suhu (°C)
                        </p>
                    </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                    <button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        title="Muat ulang data"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
                        <span>Refresh</span>
                    </button>

                    {/* Button untuk testing error state API jika user ingin melihat pesan error */}
                    <button
                        onClick={apiError ? () => setApiError(null) : triggerSimulatedError}
                        className={`text-[11px] font-medium px-2 py-1 rounded-lg border transition-colors ${apiError
                                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
                            }`}
                        title="Simulasi respon API gagal"
                    >
                        {apiError ? 'Tutup Error' : 'Tes Error API'}
                    </button>
                </div>
            </div>

            {/* ── Error Banner (Jika API Gagal) ── */}
            {apiError && (
                <div className="m-5 mb-0 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start justify-between gap-3 text-red-800 animate-fadeIn">
                    <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-red-900">
                                Terjadi Kesalahan Koneksi API
                            </h4>
                            <p className="text-xs text-red-700 mt-0.5">{apiError}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shrink-0"
                    >
                        Coba Lagi
                    </button>
                </div>
            )}

            {/* ── Filter Bar (Tersedia Saat Preview Mode Ringkas & Full Mode) ── */}
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 space-y-3">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Cari transaksi, produk, tangki..."
                            className="w-full pl-9 pr-8 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-slate-800 placeholder-slate-400"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filter controls */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                        {/* Filter Produk */}
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                            <span className="text-[11px] text-slate-400 font-semibold">Produk:</span>
                            <select
                                value={selectedProduct}
                                onChange={(e) => {
                                    setSelectedProduct(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
                            >
                                {PRODUCT_LIST.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filter Tangki */}
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                            <span className="text-[11px] text-slate-400 font-semibold">Tangki:</span>
                            <select
                                value={selectedTank}
                                onChange={(e) => {
                                    setSelectedTank(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
                            >
                                {TANK_LIST.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filter Periode (Tanggal) */}
                        <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-[11px]"
                                title="Dari Tanggal"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => {
                                    setDateTo(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-[11px]"
                                title="Sampai Tanggal"
                            />
                        </div>

                        {/* Reset Filter Button */}
                        {(searchTerm || selectedProduct !== 'Semua Produk' || selectedTank !== 'Semua Tangki' || dateFrom || dateTo) && (
                            <button
                                onClick={handleResetFilters}
                                className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold text-[11px] transition-colors"
                                title="Reset semua filter"
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Responsive Table Container ── */}
            <div className="relative overflow-x-auto min-h-[220px]">
                {isLoading ? (
                    /* Loading State Skeleton */
                    <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-400">
                        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
                        <p className="text-xs font-semibold text-slate-500">Memuat rincian data transaksi...</p>
                    </div>
                ) : displayedData.length === 0 ? (
                    /* Empty State jika data tidak ditemukan */
                    <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                            <Search className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">Tidak ada data transaksi ditemukan</h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm">
                                Coba ubah kata kunci pencarian, periode tanggal, atau pilihan filter produk/tangki Anda.
                            </p>
                        </div>
                        <button
                            onClick={handleResetFilters}
                            className="mt-2 px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
                        >
                            Reset Filter
                        </button>
                    </div>
                ) : (
                    /* Table Content */
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                                {/* Kolom Tanggal */}
                                <th
                                    onClick={() => handleSort('date')}
                                    className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>Tanggal</span>
                                        {renderSortIcon('date')}
                                    </div>
                                </th>

                                {/* Kolom Produk */}
                                <th className="py-3 px-4">Produk</th>

                                {/* Kolom Tangki */}
                                <th className="py-3 px-4">Tangki</th>

                                {/* Kolom IN Flow */}
                                <th
                                    onClick={() => handleSort('inFlow')}
                                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                                >
                                    <div className="flex items-center justify-end gap-1.5">
                                        <span>IN Flow</span>
                                        {renderSortIcon('inFlow')}
                                    </div>
                                </th>

                                {/* Kolom OUT Flow */}
                                <th
                                    onClick={() => handleSort('outFlow')}
                                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                                >
                                    <div className="flex items-center justify-end gap-1.5">
                                        <span>OUT Flow</span>
                                        {renderSortIcon('outFlow')}
                                    </div>
                                </th>

                                {/* Kolom Suhu Masuk */}
                                <th className="py-3 px-4 text-right">Suhu Masuk</th>

                                {/* Kolom Suhu Keluar */}
                                <th className="py-3 px-4 text-right">Suhu Keluar</th>

                                {/* Kolom Δ °C (Perubahan Suhu) */}
                                <th
                                    onClick={() => handleSort('deltaTemp')}
                                    className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                                >
                                    <div className="flex items-center justify-center gap-1.5">
                                        <span>Δ °C (Suhu)</span>
                                        {renderSortIcon('deltaTemp')}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {displayedData.map((row) => {
                                const delta = parseFloat((row.tempOut - row.tempIn).toFixed(1));
                                const deltaIsPositive = delta > 0;
                                const deltaIsNeutral = delta === 0;

                                return (
                                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                                        {/* Tanggal */}
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <div className="font-semibold text-slate-800">{row.date}</div>
                                            <span className="text-[10px] text-slate-400">{row.id}</span>
                                        </td>

                                        {/* Produk */}
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold ${PRODUCT_BADGE_STYLES[row.product] || 'bg-slate-100 text-slate-700 border-slate-200'
                                                    }`}
                                            >
                                                {row.product}
                                            </span>
                                        </td>

                                        {/* Tangki */}
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span className="text-slate-600 font-semibold">{row.tank}</span>
                                        </td>

                                        {/* IN Flow */}
                                        <td className="py-3 px-4 text-right whitespace-nowrap">
                                            {row.inFlow > 0 ? (
                                                <span className="font-bold text-emerald-600">
                                                    {formatNumber(row.inFlow)} MT
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>

                                        {/* OUT Flow */}
                                        <td className="py-3 px-4 text-right whitespace-nowrap">
                                            {row.outFlow > 0 ? (
                                                <span className="font-bold text-orange-600">
                                                    {formatNumber(row.outFlow)} MT
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>

                                        {/* Suhu Masuk */}
                                        <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-slate-600">
                                            {row.tempIn ? `${row.tempIn.toFixed(1)} °C` : '-'}
                                        </td>

                                        {/* Suhu Keluar */}
                                        <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-slate-600">
                                            {row.tempOut ? `${row.tempOut.toFixed(1)} °C` : '-'}
                                        </td>

                                        {/* Δ °C */}
                                        <td className="py-3 px-4 text-center whitespace-nowrap">
                                            {deltaIsNeutral ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                                                    0.0 °C
                                                </span>
                                            ) : deltaIsPositive ? (
                                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                    +{delta} °C
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                    {delta} °C
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Footer Bar ── */}
            <div className="px-5 py-3.5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* ══ Pojok Kiri Bawah: Tombol 'Lihat Selengkapnya' / 'Tutup' & Info Jumlah Data ══ */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                    <button
                        onClick={() => {
                            setIsExpanded(!isExpanded);
                            setCurrentPage(1);
                        }}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="w-4 h-4 text-amber-400" />
                                <span>Tampilkan 5 Teratas Saja</span>
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-4 h-4 text-amber-400" />
                                <span>Lihat Selengkapnya</span>
                            </>
                        )}
                    </button>

                    {/* Tampilan Jumlah Data */}
                    <span className="text-[11px] text-slate-500 font-medium">
                        {isExpanded
                            ? `Menampilkan ${Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - ${Math.min(
                                currentPage * itemsPerPage,
                                totalItems
                            )} dari ${totalItems} data`
                            : `Menampilkan ${Math.min(5, totalItems)} dari ${totalItems} data teratas`}
                    </span>
                </div>

                {/* ══ Bagian Kanan Footer: Kontrol Pagination (Aktif saat Full Mode / Expanded) ══ */}
                {isExpanded && totalPages > 1 && (
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {/* Selector items per page */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span>Baris:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>

                        {/* Pagination buttons */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                title="Halaman sebelumnya"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                                <button
                                    key={pg}
                                    onClick={() => setCurrentPage(pg)}
                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${currentPage === pg
                                            ? 'bg-amber-500 text-white shadow-sm'
                                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {pg}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                title="Halaman berikutnya"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
