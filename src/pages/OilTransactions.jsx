import React, { useState, useMemo } from 'react';
import {
    ArrowLeft, Search, ArrowUpDown, ArrowUp, ArrowDown,
    ChevronLeft, ChevronRight, RotateCcw, Droplets, Calendar,
    ArrowDownToLine, ArrowUpFromLine, Layers, X
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   Cluster Helper
───────────────────────────────────────────────────────────────────────────── */
function getTankCluster(tankName) {
    if (!tankName) return '';
    if (tankName.startsWith('TC'))  return 'C';
    if (tankName.startsWith('TI'))  return 'I';
    if (tankName.startsWith('TP'))  return 'P';
    if (tankName.startsWith('TF'))  return 'F'; // TTF juga masuk cluster F
    if (tankName.startsWith('TB'))  return 'B';
    return '';
}

/* ─────────────────────────────────────────────────────────────────────────────
   Mock Dataset: Transaksi Minyak Sawit Lengkap
───────────────────────────────────────────────────────────────────────────── */
const ALL_TRANSACTIONS = [
    { id: 'TRX-2026-001', date: '2026-09-22 10:45', product: 'CPO',         tank: 'TC1',  cluster: 'C',   inFlow: 1450.5, outFlow: 0,      tempIn: 52.3, tempOut: 55.6 },
    { id: 'TRX-2026-002', date: '2026-09-22 09:15', product: 'RBD Olein',   tank: 'TP4',  cluster: 'P',   inFlow: 0,      outFlow: 820.0,  tempIn: 48.0, tempOut: 47.2 },
    { id: 'TRX-2026-003', date: '2026-09-22 07:30', product: 'RBD Stearin', tank: 'TI2',  cluster: 'I',   inFlow: 920.0,  outFlow: 450.2,  tempIn: 61.5, tempOut: 62.1 },
    { id: 'TRX-2026-004', date: '2026-09-21 16:50', product: 'PFAD',        tank: 'TF2',  cluster: 'F',   inFlow: 650.0,  outFlow: 0,      tempIn: 58.2, tempOut: 57.5 },
    { id: 'TRX-2026-005', date: '2026-09-21 14:10', product: 'PKO',         tank: 'TB1',  cluster: 'B',   inFlow: 0,      outFlow: 730.4,  tempIn: 45.2, tempOut: 45.2 },
    { id: 'TRX-2026-006', date: '2026-09-21 11:25', product: 'CPO',         tank: 'TC5',  cluster: 'C',   inFlow: 1200.0, outFlow: 600.0,  tempIn: 53.0, tempOut: 56.2 },
    { id: 'TRX-2026-007', date: '2026-09-20 15:40', product: 'RBDPO',       tank: 'TTF',  cluster: 'F',   inFlow: 850.5,  outFlow: 400.0,  tempIn: 50.1, tempOut: 51.4 },
    { id: 'TRX-2026-008', date: '2026-09-20 13:10', product: 'RBD Olein',   tank: 'TP10', cluster: 'P',   inFlow: 1100.0, outFlow: 0,      tempIn: 49.5, tempOut: 48.8 },
    { id: 'TRX-2026-009', date: '2026-09-19 16:00', product: 'RBD Stearin', tank: 'TI7',  cluster: 'I',   inFlow: 0,      outFlow: 550.0,  tempIn: 60.8, tempOut: 62.4 },
    { id: 'TRX-2026-010', date: '2026-09-19 10:20', product: 'CPO',         tank: 'TC2',  cluster: 'C',   inFlow: 1780.0, outFlow: 920.0,  tempIn: 51.8, tempOut: 54.9 },
    { id: 'TRX-2026-011', date: '2026-09-18 14:35', product: 'PFAD',        tank: 'TF3',  cluster: 'F',   inFlow: 420.0,  outFlow: 310.0,  tempIn: 57.0, tempOut: 56.2 },
    { id: 'TRX-2026-012', date: '2026-09-18 09:05', product: 'PKO',         tank: 'TB3',  cluster: 'B',   inFlow: 890.0,  outFlow: 0,      tempIn: 44.8, tempOut: 46.1 },
    { id: 'TRX-2026-013', date: '2026-09-17 15:50', product: 'RBDPO',       tank: 'TP12', cluster: 'P',   inFlow: 0,      outFlow: 620.0,  tempIn: 51.2, tempOut: 50.8 },
    { id: 'TRX-2026-014', date: '2026-09-17 11:15', product: 'CPO',         tank: 'TC8',  cluster: 'C',   inFlow: 1350.0, outFlow: 0,      tempIn: 52.6, tempOut: 55.1 },
    { id: 'TRX-2026-015', date: '2026-09-16 16:20', product: 'RBD Olein',   tank: 'TI5',  cluster: 'I',   inFlow: 980.0,  outFlow: 750.0,  tempIn: 48.7, tempOut: 49.3 },
    { id: 'TRX-2026-016', date: '2026-09-16 10:00', product: 'RBD Stearin', tank: 'TP22', cluster: 'P',   inFlow: 650.0,  outFlow: 0,      tempIn: 62.0, tempOut: 62.5 },
    { id: 'TRX-2026-017', date: '2026-09-15 14:40', product: 'CPO',         tank: 'TC3',  cluster: 'C',   inFlow: 1600.0, outFlow: 1100.0, tempIn: 52.1, tempOut: 55.4 },
    { id: 'TRX-2026-018', date: '2026-09-15 08:30', product: 'PFAD',        tank: 'TB6',  cluster: 'B',   inFlow: 0,      outFlow: 490.0,  tempIn: 58.5, tempOut: 57.1 },
    { id: 'TRX-2026-019', date: '2026-09-14 15:10', product: 'CPO',         tank: 'TC1',  cluster: 'C',   inFlow: 1420.0, outFlow: 800.0,  tempIn: 52.8, tempOut: 55.0 },
    { id: 'TRX-2026-020', date: '2026-09-14 10:05', product: 'RBD Olein',   tank: 'TP4',  cluster: 'P',   inFlow: 890.0,  outFlow: 450.0,  tempIn: 48.2, tempOut: 48.9 },
    { id: 'TRX-2026-021', date: '2026-09-13 16:40', product: 'PKO',         tank: 'TB2',  cluster: 'B',   inFlow: 750.0,  outFlow: 300.0,  tempIn: 45.0, tempOut: 45.8 },
    { id: 'TRX-2026-022', date: '2026-09-13 11:20', product: 'RBD Stearin', tank: 'TI3',  cluster: 'I',   inFlow: 540.0,  outFlow: 200.0,  tempIn: 61.2, tempOut: 62.0 },
];

const PRODUCT_LIST = ['Semua Produk', 'CPO', 'RBD Olein', 'RBD Stearin', 'PFAD', 'PKO', 'RBDPO'];

const CLUSTER_LIST = [
    'Semua Cluster',
    'C',
    'I',
    'P',
    'F',
    'B',
];

const PRODUCT_BADGE_STYLES = {
    'CPO':         'bg-amber-50   text-amber-700   border-amber-200',
    'RBD Olein':   'bg-emerald-50 text-emerald-700 border-emerald-200',
    'RBD Stearin': 'bg-orange-50  text-orange-700  border-orange-200',
    'PFAD':        'bg-purple-50  text-purple-700  border-purple-200',
    'PKO':         'bg-blue-50    text-blue-700    border-blue-200',
    'RBDPO':       'bg-rose-50    text-rose-700    border-rose-200',
};

export default function OilTransactions({ onBack }) {
    // Filter & Search states
    const [tankSearch, setTankSearch]         = useState('');
    const [selectedProduct, setSelectedProduct] = useState('Semua Produk');
    const [selectedCluster, setSelectedCluster] = useState('Semua Cluster');
    const [dateFrom, setDateFrom]             = useState('');
    const [dateTo, setDateTo]                 = useState('');

    // Sorting states
    const [sortConfig, setSortConfig] = useState({ column: 'date', order: 'desc' });

    // Pagination states
    const [currentPage, setCurrentPage]     = useState(1);
    const [itemsPerPage, setItemsPerPage]   = useState(10);

    const handleSort = (column) => {
        setSortConfig((prev) => {
            if (prev.column === column) {
                return { column, order: prev.order === 'asc' ? 'desc' : 'asc' };
            }
            return { column, order: 'desc' };
        });
        setCurrentPage(1);
    };

    const handleResetFilters = () => {
        setTankSearch('');
        setSelectedProduct('Semua Produk');
        setSelectedCluster('Semua Cluster');
        setDateFrom('');
        setDateTo('');
        setSortConfig({ column: 'date', order: 'desc' });
        setCurrentPage(1);
    };

    // Filter and sort computation
    const filteredAndSortedData = useMemo(() => {
        let result = [...ALL_TRANSACTIONS];

        // Search engine khusus tangki:
        // - Ketik huruf cluster (C/I/P/F/B) → tampil semua tangki di cluster itu
        // - Ketik kode lengkap (TC1, TP4, dst) → cocok langsung ke tank
        if (tankSearch.trim()) {
            const query = tankSearch.trim().toLowerCase();
            const singleLetter = query.length === 1 && /[a-z]/i.test(query);
            result = result.filter((item) => {
                const clusterMatch = item.cluster
                    ? item.cluster.toLowerCase() === query ||
                      item.cluster.toLowerCase().includes(query)
                    : false;
                // Jika query 1 huruf → utamakan cluster match
                if (singleLetter && clusterMatch) return true;
                // Fallback: cocok ke kode tangki, produk, atau ID transaksi
                return (
                    item.tank.toLowerCase().includes(query) ||
                    clusterMatch ||
                    item.product.toLowerCase().includes(query) ||
                    item.id.toLowerCase().includes(query)
                );
            });
        }

        if (selectedProduct !== 'Semua Produk') {
            result = result.filter((item) => item.product === selectedProduct);
        }

        // Cluster Tangki filter
        if (selectedCluster !== 'Semua Cluster') {
            result = result.filter(
                (item) => (item.cluster || getTankCluster(item.tank)) === selectedCluster
            );
        }

        if (dateFrom) {
            result = result.filter((item) => item.date.slice(0, 10) >= dateFrom);
        }
        if (dateTo) {
            result = result.filter((item) => item.date.slice(0, 10) <= dateTo);
        }

        result.sort((a, b) => {
            let valA, valB;
            if (sortConfig.column === 'date') {
                valA = new Date(a.date).getTime();
                valB = new Date(b.date).getTime();
            } else if (sortConfig.column === 'inFlow') {
                valA = a.inFlow; valB = b.inFlow;
            } else if (sortConfig.column === 'outFlow') {
                valA = a.outFlow; valB = b.outFlow;
            } else if (sortConfig.column === 'deltaTemp') {
                valA = a.tempOut - a.tempIn;
                valB = b.tempOut - b.tempIn;
            } else {
                valA = a[sortConfig.column];
                valB = b[sortConfig.column];
            }

            if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.order === 'asc' ?  1 : -1;
            return 0;
        });

        return result;
    }, [tankSearch, selectedProduct, selectedCluster, dateFrom, dateTo, sortConfig]);

    // Totals for top statistics
    const stats = useMemo(() => {
        const totalIN  = filteredAndSortedData.reduce((s, d) => s + d.inFlow,  0);
        const totalOUT = filteredAndSortedData.reduce((s, d) => s + d.outFlow, 0);
        const net      = totalIN - totalOUT;
        return { totalIN, totalOUT, net, count: filteredAndSortedData.length };
    }, [filteredAndSortedData]);

    const totalItems = filteredAndSortedData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    const displayedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAndSortedData, currentPage, itemsPerPage]);

    const formatNumber = (val) =>
        val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const renderSortIcon = (column) => {
        if (sortConfig.column !== column) {
            return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />;
        }
        return sortConfig.order === 'asc' ? (
            <ArrowUp   className="w-3.5 h-3.5 text-amber-600 font-bold" />
        ) : (
            <ArrowDown className="w-3.5 h-3.5 text-amber-600 font-bold" />
        );
    };

    const hasActiveFilter =
        tankSearch || selectedProduct !== 'Semua Produk' ||
        selectedCluster !== 'Semua Cluster' || dateFrom || dateTo;

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 pt-16">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

                {/* ── Breadcrumb & Navigation Bar ── */}
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
                        <span className="text-amber-800 font-bold">Detail Transaksi Minyak</span>
                    </div>
                </div>

                {/* ── Header Title & Summary Cards ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-xs">
                                <Droplets className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h1 className="text-slate-800 font-bold text-lg sm:text-xl tracking-tight">
                                    Detail Transaksi Minyak
                                </h1>
                                <p className="text-slate-500 text-xs mt-0.5">
                                    Daftar lengkap seluruh transaksi aliran minyak masuk, keluar, tangki penyimpanan, dan delta suhu (°C)
                                </p>
                            </div>
                        </div>

                        <span className="self-start sm:self-auto px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
                            {totalItems} Total Transaksi
                        </span>
                    </div>

                    {/* Mini Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Transaksi</p>
                            <p className="text-base font-black text-slate-800 mt-0.5">{stats.count} Record</p>
                        </div>
                        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Total IN Flow</p>
                            <p className="text-base font-black text-emerald-700 mt-0.5">{formatNumber(stats.totalIN)} KG</p>
                        </div>
                        <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-100">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-700">Total OUT Flow</p>
                            <p className="text-base font-black text-orange-700 mt-0.5">{formatNumber(stats.totalOUT)} KG</p>
                        </div>
                        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Net Selisih</p>
                            <p className={`text-base font-black mt-0.5 ${stats.net >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                                {stats.net >= 0 ? '+' : ''}{formatNumber(stats.net)} KG
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Main Table Card ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Filter & Search Bar */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/40 space-y-3">
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">

                            {/* ══ Search Engine Khusus Tangki ══ */}
                            <div className="relative flex-1 min-w-[220px] max-w-md">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    value={tankSearch}
                                    onChange={(e) => {
                                        setTankSearch(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Cari tangki (contoh: TC1, TP4, TI2, TB1)..."
                                    className="w-full pl-9 pr-8 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-slate-800 placeholder-slate-400 font-medium"
                                />
                                {tankSearch && (
                                    <button
                                        onClick={() => setTankSearch('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Dropdowns */}
                            <div className="flex items-center gap-2 flex-wrap text-xs">

                                {/* ══ Filter Cluster Tangki ══ */}
                                <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200">
                                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                                    <span className="text-[11px] text-slate-400 font-semibold">Cluster:</span>
                                    <select
                                        value={selectedCluster}
                                        onChange={(e) => {
                                            setSelectedCluster(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
                                    >
                                        {CLUSTER_LIST.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Filter Produk */}
                                <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200">
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
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Filter Periode */}
                                <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-xl border border-slate-200">
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

                                {/* Reset Filter */}
                                {hasActiveFilter && (
                                    <button
                                        onClick={handleResetFilters}
                                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold text-xs transition-colors cursor-pointer"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>Reset</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="relative overflow-x-auto min-h-[300px]">
                        {displayedData.length === 0 ? (
                            <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                                    <Search className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">Tidak ada data tangki ditemukan</h4>
                                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                                        Coba sesuaikan kode tangki pada pencarian atau pilih cluster tangki yang lain.
                                    </p>
                                </div>
                                <button
                                    onClick={handleResetFilters}
                                    className="mt-2 px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
                                >
                                    Reset Filter
                                </button>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                                        <th
                                            onClick={() => handleSort('date')}
                                            className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span>Tanggal</span>
                                                {renderSortIcon('date')}
                                            </div>
                                        </th>
                                        <th className="py-3 px-4">Produk</th>
                                        <th className="py-3 px-4">Tangki &amp; Cluster</th>
                                        <th
                                            onClick={() => handleSort('inFlow')}
                                            className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                                        >
                                            <div className="flex items-center justify-end gap-1.5">
                                                <span>IN Flow</span>
                                                {renderSortIcon('inFlow')}
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('outFlow')}
                                            className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                                        >
                                            <div className="flex items-center justify-end gap-1.5">
                                                <span>OUT Flow</span>
                                                {renderSortIcon('outFlow')}
                                            </div>
                                        </th>
                                        <th className="py-3 px-4 text-right">Suhu Masuk</th>
                                        <th className="py-3 px-4 text-right">Suhu Keluar</th>
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
                                        const delta          = parseFloat((row.tempOut - row.tempIn).toFixed(1));
                                        const deltaIsPositive = delta > 0;
                                        const deltaIsNeutral  = delta === 0;

                                        return (
                                            <tr key={row.id} className="hover:bg-amber-50/30 transition-colors">
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <div className="font-semibold text-slate-800">{row.date}</div>
                                                    <span className="text-[10px] text-slate-400">{row.id}</span>
                                                </td>
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold ${
                                                            PRODUCT_BADGE_STYLES[row.product] || 'bg-slate-100 text-slate-700 border-slate-200'
                                                        }`}
                                                    >
                                                        {row.product}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-xs font-mono">
                                                            {row.tank}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {row.cluster || getTankCluster(row.tank)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                                    {row.inFlow > 0 ? (
                                                        <span className="font-bold text-emerald-600">
                                                            {formatNumber(row.inFlow)} KG
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                                    {row.outFlow > 0 ? (
                                                        <span className="font-bold text-orange-600">
                                                            {formatNumber(row.outFlow)} KG
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-slate-600">
                                                    {row.tempIn ? `${row.tempIn.toFixed(1)} °C` : '-'}
                                                </td>
                                                <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-slate-600">
                                                    {row.tempOut ? `${row.tempOut.toFixed(1)} °C` : '-'}
                                                </td>
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

                    {/* Pagination Footer */}
                    <div className="px-5 py-3.5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-[11px] text-slate-500 font-medium">
                            Menampilkan{' '}
                            {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} -{' '}
                            {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} data
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                    <span>Baris:</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none cursor-pointer"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                        title="Halaman sebelumnya"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                                        <button
                                            key={pg}
                                            onClick={() => setCurrentPage(pg)}
                                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                                currentPage === pg
                                                    ? 'bg-amber-500 text-white shadow-xs'
                                                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {pg}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                        title="Halaman berikutnya"
                                    >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
