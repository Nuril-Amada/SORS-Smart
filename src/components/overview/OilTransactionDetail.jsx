import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, ArrowUpDown, ArrowUp, ArrowDown,
    RotateCcw, Droplets, Calendar, ArrowRight, X, Layers
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   Cluster Helper & List
───────────────────────────────────────────────────────────────────────────── */
export function getTankCluster(tankName) {
    if (!tankName) return '';
    if (tankName.startsWith('TC'))  return 'C';
    if (tankName.startsWith('TI'))  return 'I';
    if (tankName.startsWith('TP'))  return 'P';
    if (tankName.startsWith('TF'))  return 'F'; // TTF juga masuk cluster F
    if (tankName.startsWith('TB'))  return 'B';
    return '';
}

export const CLUSTER_LIST = [
    'Semua Cluster',
    'C',
    'I',
    'P',
    'F',
    'B',
];

/* ─────────────────────────────────────────────────────────────────────────────
   Mock Dataset: Transaksi Minyak Sawit dengan Kode Tangki Real
   (TC1-TC8, TI1-TI9, TP1-TP22, TF2-TF3, TB1-TB6, TTF)
───────────────────────────────────────────────────────────────────────────── */
const INITIAL_TRANSACTIONS = [
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
];

const PRODUCT_LIST = ['Semua Produk', 'CPO', 'RBD Olein', 'RBD Stearin', 'PFAD', 'PKO', 'RBDPO'];

const PRODUCT_BADGE_STYLES = {
    'CPO': 'bg-amber-50 text-amber-700 border-amber-200',
    'RBD Olein': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'RBD Stearin': 'bg-orange-50 text-orange-700 border-orange-200',
    'PFAD': 'bg-purple-50 text-purple-700 border-purple-200',
    'PKO': 'bg-blue-50 text-blue-700 border-blue-200',
    'RBDPO': 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function OilTransactionDetail({ filters, onViewAll }) {
    // Filter & Search states
    const [tankSearch, setTankSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('Semua Produk');
    const [selectedCluster, setSelectedCluster] = useState('Semua Cluster');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Sorting states
    const [sortConfig, setSortConfig] = useState({ column: 'date', order: 'desc' });

    // Sinkronisasi filter jika parent menyediakan filter global
    useEffect(() => {
        if (filters?.product) {
            setSelectedProduct(filters.product);
        }
        if (filters?.cluster) {
            const clus = filters.cluster.startsWith('Cluster') ? filters.cluster : `Cluster ${filters.cluster}`;
            setSelectedCluster(clus);
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
    };

    // Reset filters
    const handleResetFilters = () => {
        setTankSearch('');
        setSelectedProduct('Semua Produk');
        setSelectedCluster('Semua Cluster');
        setDateFrom('');
        setDateTo('');
        setSortConfig({ column: 'date', order: 'desc' });
    };

    // Filter and sort computation
    const filteredAndSortedData = useMemo(() => {
        let result = [...INITIAL_TRANSACTIONS];

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
                if (singleLetter && clusterMatch) return true;
                return (
                    item.tank.toLowerCase().includes(query) ||
                    clusterMatch ||
                    item.product.toLowerCase().includes(query) ||
                    item.id.toLowerCase().includes(query)
                );
            });
        }

        // Product filter
        if (selectedProduct !== 'Semua Produk') {
            result = result.filter((item) => item.product === selectedProduct);
        }

        // Cluster Tangki filter (dropdown)
        if (selectedCluster !== 'Semua Cluster') {
            result = result.filter((item) => (item.cluster || getTankCluster(item.tank)) === selectedCluster);
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
    }, [tankSearch, selectedProduct, selectedCluster, dateFrom, dateTo, sortConfig]);

    const totalItems = filteredAndSortedData.length;
    // Tampilkan 5 data teratas di komponen overview
    const displayedData = useMemo(() => {
        return filteredAndSortedData.slice(0, 5);
    }, [filteredAndSortedData]);

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

    const handleViewAllClick = () => {
        if (onViewAll) {
            onViewAll();
        } else {
            window.history.pushState({}, '', '/detail-transaksi');
            window.dispatchEvent(new PopStateEvent('popstate'));
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
            {/* ── Header Bagian ── */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <Droplets className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800 text-sm md:text-base">
                                Detail Transaksi Minyak
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                5 Teratas
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Rincian transaksi aliran minyak masuk, keluar, tangki, dan perubahan suhu (Δ °C)
                        </p>
                    </div>
                </div>

                {/* ══ Tombol Pojok Kanan Atas: Lihat Selengkapnya (Warna Kuning / Cream) ══ */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleViewAllClick}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer active:scale-95"
                        title="Buka halaman penuh detail transaksi minyak"
                    >
                        <span>Lihat Selengkapnya</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-900" />
                    </button>
                </div>
            </div>

            {/* ── Filter Bar Ringkas ── */}
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    {/* ══ Search Engine Khusus Tangki ══ */}
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={tankSearch}
                            onChange={(e) => setTankSearch(e.target.value)}
                            placeholder="Cari tangki (contoh: TC1, TP4, TI2, TB1)..."
                            className="w-full pl-9 pr-8 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-slate-800 placeholder-slate-400 font-medium"
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

                    {/* Filter controls */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                        {/* ══ Dropdown Cluster Tangki ══ */}
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                            <Layers className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-[11px] text-slate-400 font-semibold">Cluster:</span>
                            <select
                                value={selectedCluster}
                                onChange={(e) => setSelectedCluster(e.target.value)}
                                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
                            >
                                {CLUSTER_LIST.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filter Produk */}
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                            <span className="text-[11px] text-slate-400 font-semibold">Produk:</span>
                            <select
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
                            >
                                {PRODUCT_LIST.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filter Periode */}
                        <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-[11px]"
                                title="Dari Tanggal"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-[11px]"
                                title="Sampai Tanggal"
                            />
                        </div>

                        {/* Reset Filter Button */}
                        {(tankSearch || selectedProduct !== 'Semua Produk' || selectedCluster !== 'Semua Cluster' || dateFrom || dateTo) && (
                            <button
                                onClick={handleResetFilters}
                                className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold text-[11px] transition-colors cursor-pointer"
                                title="Reset semua filter"
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Table View (5 Teratas) ── */}
            <div className="relative overflow-x-auto">
                {displayedData.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
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
                                const delta = parseFloat((row.tempOut - row.tempIn).toFixed(1));
                                const deltaIsPositive = delta > 0;
                                const deltaIsNeutral = delta === 0;

                                return (
                                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
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

            {/* ── Footer Bar ── */}
            <div className="px-5 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    <span>Menampilkan 5 transaksi teratas dari total {totalItems} data</span>
                </div>
            </div>
        </div>
    );
}
