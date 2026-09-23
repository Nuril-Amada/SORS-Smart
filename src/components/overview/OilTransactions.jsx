import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, ArrowUpDown, ArrowUp, ArrowDown, ArrowLeft,
    ChevronLeft, ChevronRight, RotateCcw, Droplets, Calendar,
    ArrowRight, X
} from 'lucide-react';

/* ═════════════════════════════════════════════════════════════════════════════
   BAGIAN 1 — DATA & HELPER BERSAMA
   Satu-satunya tempat data/logika transaksi didefinisikan. Kedua komponen di
   bawah (widget & halaman penuh) memakai konstanta dan fungsi dari sini,
   jadi tidak ada lagi risiko duplikasi/beda logika antara keduanya.

   STATUS: siap disambungkan ke backend/database.
   ALL_TRANSACTIONS sengaja dikosongkan (tidak ada data dummy).

   Cara menyambungkan ke API asli — dua opsi:

   OPSI A (fetch langsung di sini):
     Ganti `const ALL_TRANSACTIONS = []` menjadi hasil fetch, lalu panggil
     dari komponen dengan useEffect+useState:
       async function fetchTransactions() {
         const res = await fetch('/api/transactions');
         if (!res.ok) throw new Error('Gagal memuat data transaksi');
         return res.json(); // pastikan tiap item sesuai TRANSACTION_SHAPE di bawah
       }

   OPSI B (data dioper dari parent/props):
     Biarkan ALL_TRANSACTIONS kosong, lalu render <OilTransactionDetail
     transactions={data} /> atau <OilTransactionsPage transactions={data} />
     dengan data yang sudah di-fetch oleh komponen induk.

   Bentuk satu baris data yang diharapkan (TRANSACTION_SHAPE):
     {
       id: string,       // contoh: 'TRX-2026-001'
       date: string,      // ISO atau 'YYYY-MM-DD HH:mm'
       tank: string,      // kode tangki, contoh: 'TC1'
       product: string,   // salah satu dari PRODUCT_LIST (selain 'Semua Produk')
       inFlow: number,    // kg, 0 jika tidak ada aliran masuk
       outFlow: number,   // kg, 0 jika tidak ada aliran keluar
       tempIn: number,    // suhu (°C) — dipakai kolom "Suhu (°C)" & hitung Delta
       tempOut: number,   // suhu (°C) — tidak ditampilkan sendiri, hanya untuk Delta
     }
═════════════════════════════════════════════════════════════════════════════ */

const PRODUCT_LIST = ['Semua Produk', 'CPO', 'RBD Olein', 'RBD Stearin', 'PFAD', 'PKO', 'RBDPO'];

const PRODUCT_BADGE_STYLES = {
    'CPO': 'bg-amber-50 text-amber-700 border-amber-200',
    'RBD Olein': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'RBD Stearin': 'bg-orange-50 text-orange-700 border-orange-200',
    'PFAD': 'bg-purple-50 text-purple-700 border-purple-200',
    'PKO': 'bg-blue-50 text-blue-700 border-blue-200',
    'RBDPO': 'bg-rose-50 text-rose-700 border-rose-200',
};

// Kosong sengaja — tidak ada lagi data dummy. Isi lewat backend (lihat opsi A/B di atas).
const ALL_TRANSACTIONS = [];

// Default state filter, dipakai widget & halaman penuh supaya nilai awal dan reset sama persis.
const DEFAULT_FILTERS = {
    tankSearch: '',
    product: 'Semua Produk',
    dateFrom: '',
    dateTo: '',
};

/**
 * Filter + sort satu fungsi bersama. Pencarian tangki (tankSearch) HANYA
 * mencocokkan ke kode tangki (item.tank) — tidak ke produk atau ID transaksi.
 */
function filterAndSortTransactions(data, { tankSearch, product, dateFrom, dateTo }, sortConfig) {
    let result = [...data];

    if (tankSearch?.trim()) {
        const query = tankSearch.trim().toLowerCase();
        result = result.filter((item) => item.tank.toLowerCase().includes(query));
    }
    if (product && product !== 'Semua Produk') {
        result = result.filter((item) => item.product === product);
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
        if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
        return 0;
    });

    return result;
}

const formatNumber = (val) => val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function SortIcon({ active, order }) {
    if (!active) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />;
    return order === 'asc'
        ? <ArrowUp className="w-3.5 h-3.5 text-amber-600 font-bold" />
        : <ArrowDown className="w-3.5 h-3.5 text-amber-600 font-bold" />;
}

/* ═════════════════════════════════════════════════════════════════════════════
   BAGIAN 2 — WIDGET RINGKAS (untuk Overview, tampil 5 teratas)
   Kolom: Tanggal, Tangki, Produk, IN Flow, OUT Flow, Suhu (°C), Delta °C
═════════════════════════════════════════════════════════════════════════════ */

export function OilTransactionDetail({ filters, onViewAll, transactions }) {
    const sourceData = transactions ?? ALL_TRANSACTIONS;

    const [tankSearch, setTankSearch] = useState(DEFAULT_FILTERS.tankSearch);
    const [selectedProduct, setSelectedProduct] = useState(DEFAULT_FILTERS.product);
    const [dateFrom, setDateFrom] = useState(DEFAULT_FILTERS.dateFrom);
    const [dateTo, setDateTo] = useState(DEFAULT_FILTERS.dateTo);
    const [sortConfig, setSortConfig] = useState({ column: 'date', order: 'desc' });

    // Sinkron filter dari parent (FilterBar global). `!== undefined` dipakai
    // (bukan truthy check) supaya nilai '' dari tombol Reset tetap ikut ke-reset di sini.
    useEffect(() => {
        if (!filters) return;
        if (filters.product !== undefined) setSelectedProduct(filters.product || DEFAULT_FILTERS.product);
        if (filters.dateFrom !== undefined) setDateFrom(filters.dateFrom || '');
        if (filters.dateTo !== undefined) setDateTo(filters.dateTo || '');
    }, [filters]);

    const handleSort = (column) => {
        setSortConfig((prev) =>
            prev.column === column ? { column, order: prev.order === 'asc' ? 'desc' : 'asc' } : { column, order: 'desc' }
        );
    };

    const handleResetFilters = () => {
        setTankSearch(DEFAULT_FILTERS.tankSearch);
        setSelectedProduct(DEFAULT_FILTERS.product);
        setDateFrom(DEFAULT_FILTERS.dateFrom);
        setDateTo(DEFAULT_FILTERS.dateTo);
        setSortConfig({ column: 'date', order: 'desc' });
    };

    const filteredAndSortedData = useMemo(
        () => filterAndSortTransactions(sourceData, { tankSearch, product: selectedProduct, dateFrom, dateTo }, sortConfig),
        [sourceData, tankSearch, selectedProduct, dateFrom, dateTo, sortConfig]
    );

    const totalItems = filteredAndSortedData.length;
    const displayedData = useMemo(() => filteredAndSortedData.slice(0, 5), [filteredAndSortedData]);

    // Filter yang aktif dioper ke halaman penuh saat "Lihat Selengkapnya" diklik.
    const handleViewAllClick = () => {
        const currentFilters = { tankSearch, product: selectedProduct, dateFrom, dateTo };
        if (onViewAll) onViewAll(currentFilters);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <Droplets className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800 text-sm md:text-base">Detail Transaksi Minyak</h3>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">5 Teratas</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Rincian transaksi aliran minyak masuk, keluar, tangki, dan perubahan suhu (Δ °C)</p>
                    </div>
                </div>
                <button
                    onClick={handleViewAllClick}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer active:scale-95"
                >
                    <span>Lihat Selengkapnya</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-900" />
                </button>
            </div>

            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={tankSearch}
                            onChange={(e) => setTankSearch(e.target.value)}
                            placeholder="Cari nama tangki (contoh: TC1, TP4)..."
                            className="w-full pl-9 pr-8 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-slate-800 placeholder-slate-400 font-medium"
                        />
                        {tankSearch && (
                            <button onClick={() => setTankSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                            <span className="text-[11px] text-slate-400 font-semibold">Produk:</span>
                            <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer">
                                {PRODUCT_LIST.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-[11px]" title="Dari Tanggal" />
                            <span className="text-slate-400">-</span>
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-[11px]" title="Sampai Tanggal" />
                        </div>
                        {(tankSearch || selectedProduct !== DEFAULT_FILTERS.product || dateFrom || dateTo) && (
                            <button onClick={handleResetFilters} className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold text-[11px] transition-colors cursor-pointer">
                                <RotateCcw className="w-3 h-3" /><span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative overflow-x-auto">
                {displayedData.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500"><Search className="w-6 h-6" /></div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">{sourceData.length === 0 ? 'Belum ada data transaksi' : 'Tidak ada data tangki ditemukan'}</h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm">
                                {sourceData.length === 0 ? 'Data akan muncul setelah tersambung ke backend/database.' : 'Coba sesuaikan nama tangki pada pencarian atau ubah filter lainnya.'}
                            </p>
                        </div>
                        {sourceData.length > 0 && (
                            <button onClick={handleResetFilters} className="mt-2 px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer">Reset Filter</button>
                        )}
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                                <th onClick={() => handleSort('date')} className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors group select-none">
                                    <div className="flex items-center gap-1.5"><span>Tanggal</span><SortIcon active={sortConfig.column === 'date'} order={sortConfig.order} /></div>
                                </th>
                                <th className="py-3 px-4">Tangki</th>
                                <th className="py-3 px-4">Produk</th>
                                <th onClick={() => handleSort('inFlow')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/70 transition-colors group select-none">
                                    <div className="flex items-center justify-end gap-1.5"><span>IN Flow</span><SortIcon active={sortConfig.column === 'inFlow'} order={sortConfig.order} /></div>
                                </th>
                                <th onClick={() => handleSort('outFlow')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/70 transition-colors group select-none">
                                    <div className="flex items-center justify-end gap-1.5"><span>OUT Flow</span><SortIcon active={sortConfig.column === 'outFlow'} order={sortConfig.order} /></div>
                                </th>
                                <th className="py-3 px-4 text-right">Suhu (°C)</th>
                                <th onClick={() => handleSort('deltaTemp')} className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100/70 transition-colors group select-none">
                                    <div className="flex items-center justify-center gap-1.5"><span>Δ °C</span><SortIcon active={sortConfig.column === 'deltaTemp'} order={sortConfig.order} /></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {displayedData.map((row) => {
                                const delta = parseFloat((row.tempOut - row.tempIn).toFixed(1));
                                return (
                                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <div className="font-semibold text-slate-800">{row.date}</div>
                                            <span className="text-[10px] text-slate-400">{row.id}</span>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span className="font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-xs font-mono">{row.tank}</span>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold ${PRODUCT_BADGE_STYLES[row.product] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>{row.product}</span>
                                        </td>
                                        <td className="py-3 px-4 text-right whitespace-nowrap">{row.inFlow > 0 ? <span className="font-bold text-emerald-600">{formatNumber(row.inFlow)} KG</span> : <span className="text-slate-300">-</span>}</td>
                                        <td className="py-3 px-4 text-right whitespace-nowrap">{row.outFlow > 0 ? <span className="font-bold text-orange-600">{formatNumber(row.outFlow)} KG</span> : <span className="text-slate-300">-</span>}</td>
                                        <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-slate-600">{row.tempIn ? `${row.tempIn.toFixed(1)} °C` : '-'}</td>
                                        <td className="py-3 px-4 text-center whitespace-nowrap">
                                            {delta === 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">0.0 °C</span>
                                            ) : delta > 0 ? (
                                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">+{delta} °C</span>
                                            ) : (
                                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">{delta} °C</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    <span>Menampilkan 5 transaksi teratas dari total {totalItems} data</span>
                </div>
            </div>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   BAGIAN 3 — HALAMAN PENUH (dengan pagination & ringkasan statistik)
═════════════════════════════════════════════════════════════════════════════ */

export function OilTransactionsPage({ onBack, initialFilters, transactions }) {
    const sourceData = transactions ?? ALL_TRANSACTIONS;

    const [tankSearch, setTankSearch] = useState(initialFilters?.tankSearch ?? DEFAULT_FILTERS.tankSearch);
    const [selectedProduct, setSelectedProduct] = useState(initialFilters?.product ?? DEFAULT_FILTERS.product);
    const [dateFrom, setDateFrom] = useState(initialFilters?.dateFrom ?? DEFAULT_FILTERS.dateFrom);
    const [dateTo, setDateTo] = useState(initialFilters?.dateTo ?? DEFAULT_FILTERS.dateTo);
    const [sortConfig, setSortConfig] = useState({ column: 'date', order: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handleSort = (column) => {
        setSortConfig((prev) =>
            prev.column === column ? { column, order: prev.order === 'asc' ? 'desc' : 'asc' } : { column, order: 'desc' }
        );
        setCurrentPage(1);
    };

    const handleResetFilters = () => {
        setTankSearch(DEFAULT_FILTERS.tankSearch);
        setSelectedProduct(DEFAULT_FILTERS.product);
        setDateFrom(DEFAULT_FILTERS.dateFrom);
        setDateTo(DEFAULT_FILTERS.dateTo);
        setSortConfig({ column: 'date', order: 'desc' });
        setCurrentPage(1);
    };

    const filteredAndSortedData = useMemo(
        () => filterAndSortTransactions(sourceData, { tankSearch, product: selectedProduct, dateFrom, dateTo }, sortConfig),
        [sourceData, tankSearch, selectedProduct, dateFrom, dateTo, sortConfig]
    );

    const stats = useMemo(() => {
        const totalIN = filteredAndSortedData.reduce((s, d) => s + d.inFlow, 0);
        const totalOUT = filteredAndSortedData.reduce((s, d) => s + d.outFlow, 0);
        return { totalIN, totalOUT, net: totalIN - totalOUT, count: filteredAndSortedData.length };
    }, [filteredAndSortedData]);

    const totalItems = filteredAndSortedData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const displayedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedData.slice(start, start + itemsPerPage);
    }, [filteredAndSortedData, currentPage, itemsPerPage]);

    const hasActiveFilter = tankSearch || selectedProduct !== DEFAULT_FILTERS.product || dateFrom || dateTo;

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 pt-16">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <button onClick={onBack} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 font-semibold text-xs transition-all shadow-xs group cursor-pointer">
                        <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
                        <span>Kembali ke Overview</span>
                    </button>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <span>Overview</span><span>/</span><span className="text-amber-800 font-bold">Detail Transaksi Minyak</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-xs">
                                <Droplets className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h1 className="text-slate-800 font-bold text-lg sm:text-xl tracking-tight">Detail Transaksi Minyak</h1>
                                <p className="text-slate-500 text-xs mt-0.5">Daftar lengkap seluruh transaksi aliran minyak masuk, keluar, tangki penyimpanan, dan delta suhu (°C)</p>
                            </div>
                        </div>
                        <span className="self-start sm:self-auto px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">{totalItems} Total Transaksi</span>
                    </div>
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
                            <p className={`text-base font-black mt-0.5 ${stats.net >= 0 ? 'text-blue-700' : 'text-red-600'}`}>{stats.net >= 0 ? '+' : ''}{formatNumber(stats.net)} KG</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/40 space-y-3">
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                            <div className="relative flex-1 min-w-[220px] max-w-md">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    value={tankSearch}
                                    onChange={(e) => { setTankSearch(e.target.value); setCurrentPage(1); }}
                                    placeholder="Cari nama tangki (contoh: TC1, TP4)..."
                                    className="w-full pl-9 pr-8 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-slate-800 placeholder-slate-400 font-medium"
                                />
                                {tankSearch && (
                                    <button onClick={() => setTankSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                                <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200">
                                    <span className="text-[11px] text-slate-400 font-semibold">Produk:</span>
                                    <select value={selectedProduct} onChange={(e) => { setSelectedProduct(e.target.value); setCurrentPage(1); }} className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer">
                                        {PRODUCT_LIST.map((p) => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-xl border border-slate-200">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }} className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-[11px]" title="Dari Tanggal" />
                                    <span className="text-slate-400">-</span>
                                    <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }} className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-[11px]" title="Sampai Tanggal" />
                                </div>
                                {hasActiveFilter && (
                                    <button onClick={handleResetFilters} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold text-xs transition-colors cursor-pointer">
                                        <RotateCcw className="w-3 h-3" /><span>Reset</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-x-auto min-h-[300px]">
                        {displayedData.length === 0 ? (
                            <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500"><Search className="w-6 h-6" /></div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">{sourceData.length === 0 ? 'Belum ada data transaksi' : 'Tidak ada data tangki ditemukan'}</h4>
                                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                                        {sourceData.length === 0 ? 'Data akan muncul setelah tersambung ke backend/database.' : 'Coba sesuaikan nama tangki pada pencarian atau ubah filter lainnya.'}
                                    </p>
                                </div>
                                {sourceData.length > 0 && (
                                    <button onClick={handleResetFilters} className="mt-2 px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer">Reset Filter</button>
                                )}
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                                        <th onClick={() => handleSort('date')} className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors group select-none">
                                            <div className="flex items-center gap-1.5"><span>Tanggal</span><SortIcon active={sortConfig.column === 'date'} order={sortConfig.order} /></div>
                                        </th>
                                        <th className="py-3 px-4">Tangki</th>
                                        <th className="py-3 px-4">Produk</th>
                                        <th onClick={() => handleSort('inFlow')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/70 transition-colors group select-none">
                                            <div className="flex items-center justify-end gap-1.5"><span>IN Flow</span><SortIcon active={sortConfig.column === 'inFlow'} order={sortConfig.order} /></div>
                                        </th>
                                        <th onClick={() => handleSort('outFlow')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/70 transition-colors group select-none">
                                            <div className="flex items-center justify-end gap-1.5"><span>OUT Flow</span><SortIcon active={sortConfig.column === 'outFlow'} order={sortConfig.order} /></div>
                                        </th>
                                        <th className="py-3 px-4 text-right">Suhu (°C)</th>
                                        <th onClick={() => handleSort('deltaTemp')} className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100/70 transition-colors group select-none">
                                            <div className="flex items-center justify-center gap-1.5"><span>Δ °C</span><SortIcon active={sortConfig.column === 'deltaTemp'} order={sortConfig.order} /></div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                    {displayedData.map((row) => {
                                        const delta = parseFloat((row.tempOut - row.tempIn).toFixed(1));
                                        return (
                                            <tr key={row.id} className="hover:bg-amber-50/30 transition-colors">
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <div className="font-semibold text-slate-800">{row.date}</div>
                                                    <span className="text-[10px] text-slate-400">{row.id}</span>
                                                </td>
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <span className="font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-xs font-mono">{row.tank}</span>
                                                </td>
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold ${PRODUCT_BADGE_STYLES[row.product] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>{row.product}</span>
                                                </td>
                                                <td className="py-3 px-4 text-right whitespace-nowrap">{row.inFlow > 0 ? <span className="font-bold text-emerald-600">{formatNumber(row.inFlow)} KG</span> : <span className="text-slate-300">-</span>}</td>
                                                <td className="py-3 px-4 text-right whitespace-nowrap">{row.outFlow > 0 ? <span className="font-bold text-orange-600">{formatNumber(row.outFlow)} KG</span> : <span className="text-slate-300">-</span>}</td>
                                                <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-slate-600">{row.tempIn ? `${row.tempIn.toFixed(1)} °C` : '-'}</td>
                                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                                    {delta === 0 ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">0.0 °C</span>
                                                    ) : delta > 0 ? (
                                                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">+{delta} °C</span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">{delta} °C</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="px-5 py-3.5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-[11px] text-slate-500 font-medium">
                            Menampilkan {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} data
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                    <span>Baris:</span>
                                    <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none cursor-pointer">
                                        <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"><ChevronLeft className="w-3.5 h-3.5" /></button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                                        <button key={pg} onClick={() => setCurrentPage(pg)} className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${currentPage === pg ? 'bg-amber-500 text-white shadow-xs' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{pg}</button>
                                    ))}
                                    <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"><ChevronRight className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Catatan integrasi (project ini pakai react-router-dom, lihat App.jsx):

   - OilTransactionDetail dipakai di pages/Overview.jsx, filter tabel yang
     aktif dioper lewat onViewAll(filters) -> navigate('/detail-transaksi',
     { state: filters }).
   - OilTransactionsPage dipakai di pages/OilTransactions.jsx (halaman route
     '/detail-transaksi'), yang membaca filter tadi lewat useLocation().state
     dan meneruskannya sebagai prop initialFilters ke komponen ini.

   Tidak ada default export di file ini secara sengaja — kedua komponen di
   atas selalu diimpor sebagai named export supaya jelas mana widget, mana
   halaman penuh, dan supaya router (App.jsx) yang mengatur perpindahannya.
───────────────────────────────────────────────────────────────────────────── */