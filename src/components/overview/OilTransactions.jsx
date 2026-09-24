import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, ArrowUpDown, ArrowUp, ArrowDown, ArrowLeft,
    ChevronLeft, ChevronRight, ChevronDown, RotateCcw, Droplets, Calendar,
    ArrowRight, X
} from 'lucide-react';

/* ═════════════════════════════════════════════════════════════════════════════
   BAGIAN 1 — DATA & HELPER BERSAMA
   Satu-satunya tempat data/logika transaksi didefinisikan. Widget & halaman
   penuh memakai konstanta, helper, dan tabel dari sini.

   STATUS: siap disambungkan ke backend/database.
   ALL_TRANSACTIONS sengaja dikosongkan (tidak ada data dummy).

   Cara mengisi data — dua opsi:

   OPSI A (fetch langsung di sini):
     async function fetchTransactions() {
       const res = await fetch('/api/transactions');
       if (!res.ok) throw new Error('Gagal memuat data transaksi');
       return res.json(); // tiap item harus sesuai TRANSACTION_SHAPE di bawah
     }

   OPSI B (data dioper dari parent/props):
     <OilTransactionDetail transactions={data} />
     <OilTransactionsPage transactions={data} />

   Satu baris data = SATU TANGKI PADA SATU TANGGAL (snapshot harian).
   Bentuk data (TRANSACTION_SHAPE), dengan asal kolom Excel-nya:
     {
       id: string,           // unik, contoh: '2026-08-31_TC2_CPO'
       date: string,         // 'YYYY-MM-DD'                       <- Date
       tfarm: string,        // 'C - 2'                            <- T-Farm
       tank: string,         // 'TC2'                              <- Tank
       productTank: string,  // 'RO KMSC' (detail produk tangki)   <- Product Tankfarm
       product: string,      // salah satu PRODUCT_LIST            <- Product
       beginning: number,    // stok awal (kg)                     <- Beginning
       ending: number,       // stok akhir (kg)                    <- Ending
       flows: {              // hanya grup yang punya aliran yang perlu ada
         perak:         { in, out },   // Perak-Supplier
         refinery:      { in, out },   // Refinery-NSS
         fractionation: { in, out },   // Fractionation
         marg:          { in, out },   // Marg Plant
         filling:       { in, out },   // Filling Plant
         gbj:           { in, out },   // GBJ
         others:        { in, out },   // Others
         transfer:      { in, out },   // Transfer
         matToMat:      { in },        // Mat To Mat (hanya IN)
         customer:      { in, out },   // Customer
       },                    // nilai OUT boleh negatif (seperti di Excel), UI memakai nilai absolut
       gl: number,           // Gain/Loss (kg)                     <- GL
       glPct: number,        // pecahan, -0.0016 = -0,16%          <- G-L (%)
       glFlag: boolean,      // true jika di luar batas ±0,2%      <- kolom ">0,2 <-0,2"
       cause: string,        // analisa penyebab                   <- Analisa Penyebab
       temp: number | null,       // suhu (°C)  -> kolom "Suhu (°C)"  (dari backend)
       deltaTemp: number | null,  // perubahan suhu Δ °C -> kolom "Δ °C" (dari backend)
     }
   Suhu & Δ °C opsional: jika backend mengirim tempIn/tempOut saja, maka
   temp = tempIn dan deltaTemp = tempOut - tempIn (lihat getTemp/getDelta).
   Jika tidak ada, sel menampilkan "-".
   Rumus di Excel: GL = Ending - Beginning - (total IN + total OUT bertanda).
═════════════════════════════════════════════════════════════════════════════ */

// Daftar produk (nilai harus sama persis dengan kolom `product`, termasuk huruf & spasi).
const PRODUCT_LIST = [
    'Semua Produk',
    'CPO',
    'RBDHPO',
    'PFAD',
    'RBD CNO',
    'RBDPO',
    'RBD Olein',
    'Soap Stock',
    'RBDST',
    'MIXED OIL',
    'PAO',
    'RBD INFAT',
    'NPO',
    'RBDFHPKO',
    'CDPO',
];

// Cluster tangki. Cluster diambil dari huruf kode tangki: 'TC1' -> C, 'TP4' -> P, 'C-RM' -> C.
const CLUSTER_LIST = ['Semua Cluster', 'C', 'I', 'P', 'F', 'B'];

// Kalau format kode tangki di database berbeda, cukup ubah fungsi ini.
const getTankCluster = (tank) => {
    const match = String(tank ?? '').trim().toUpperCase().match(/^T?([A-Z])/);
    return match ? match[1] : '';
};

// Grup aliran (asal/tujuan) sesuai header Excel. `key` = kunci di row.flows.
const FLOW_GROUPS = [
    { key: 'perak', label: 'Perak-Supplier' },
    { key: 'refinery', label: 'Refinery-NSS' },
    { key: 'fractionation', label: 'Fractionation' },
    { key: 'marg', label: 'Marg Plant' },
    { key: 'filling', label: 'Filling Plant' },
    { key: 'gbj', label: 'GBJ' },
    { key: 'others', label: 'Others' },
    { key: 'transfer', label: 'Transfer' },
    { key: 'matToMat', label: 'Mat To Mat' },
    { key: 'customer', label: 'Customer' },
];
const ALL_GROUPS = 'all';
const getGroupLabel = (key) => FLOW_GROUPS.find((g) => g.key === key)?.label ?? 'Semua Grup';

const PRODUCT_BADGE_STYLES = {
    'CPO': 'bg-amber-50 text-amber-700 border-amber-200',
    'RBDHPO': 'bg-lime-50 text-lime-700 border-lime-200',
    'PFAD': 'bg-purple-50 text-purple-700 border-purple-200',
    'RBD CNO': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'RBDPO': 'bg-rose-50 text-rose-700 border-rose-200',
    'RBD Olein': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Soap Stock': 'bg-stone-100 text-stone-700 border-stone-300',
    'RBDST': 'bg-orange-50 text-orange-700 border-orange-200',
    'MIXED OIL': 'bg-teal-50 text-teal-700 border-teal-200',
    'PAO': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'RBD INFAT': 'bg-pink-50 text-pink-700 border-pink-200',
    'NPO': 'bg-sky-50 text-sky-700 border-sky-200',
    'RBDFHPKO': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    'CDPO': 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

// Kosong sengaja — tidak ada lagi data dummy. Isi lewat backend (lihat opsi A/B di atas).
const ALL_TRANSACTIONS = [];

// Default state filter, dipakai widget & halaman penuh supaya nilai awal dan reset sama persis.
// onlyActive: filter "Hanya yang ada aliran" (sembunyikan tangki yang diam). Bawaan: mati, jadi tombol
// Reset baru muncul saat dicentang. Widget Overview selalu memakainya (true) dan meneruskannya ke halaman penuh.
const DEFAULT_FILTERS = {
    tankSearch: '',
    product: 'Semua Produk',
    cluster: 'Semua Cluster',
    group: ALL_GROUPS,
    dateFrom: '',
    dateTo: '',
    onlyActive: false,
};

// Urutan tetap untuk widget Overview: tanggal terbaru di atas.
const SORT_LATEST = { column: 'date', order: 'desc' };

// Normalisasi tanggal 'YYYY-MM-DD HH:mm' (pakai spasi) supaya terbaca konsisten di semua browser.
const toTime = (s) => new Date(String(s).replace(' ', 'T')).getTime();

const formatDate = (s) =>
    new Date(String(s).replace(' ', 'T')).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

const formatNumber = (val) =>
    (Number(val) || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/* ── Helper aliran ─ OUT di Excel bernilai negatif, jadi selalu diambil nilai absolutnya ── */
const absNum = (v) => Math.abs(Number(v) || 0);
const groupIn = (row, key) => absNum(row.flows?.[key]?.in);
const groupOut = (row, key) => absNum(row.flows?.[key]?.out);

// group = ALL_GROUPS -> total semua grup; selain itu -> hanya grup tersebut.
const rowIn = (row, group = ALL_GROUPS) =>
    group === ALL_GROUPS ? FLOW_GROUPS.reduce((s, g) => s + groupIn(row, g.key), 0) : groupIn(row, group);
const rowOut = (row, group = ALL_GROUPS) =>
    group === ALL_GROUPS ? FLOW_GROUPS.reduce((s, g) => s + groupOut(row, g.key), 0) : groupOut(row, group);

const hasMovement = (row) => rowIn(row) > 0 || rowOut(row) > 0;

/* ── Suhu ─ null jika datanya tidak ada ── */
const toNumOrNull = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const getTemp = (row) => toNumOrNull(row.temp ?? row.tempIn);
const getDelta = (row) => {
    const direct = toNumOrNull(row.deltaTemp);
    if (direct !== null) return parseFloat(direct.toFixed(1));
    const tin = toNumOrNull(row.tempIn);
    const tout = toNumOrNull(row.tempOut);
    return tin !== null && tout !== null ? parseFloat((tout - tin).toFixed(1)) : null;
};

/**
 * Filter + sort satu fungsi bersama.
 * - tankSearch hanya mencocokkan kode tangki (item.tank).
 * - cluster memakai huruf cluster dari kode tangki (getTankCluster).
 * - group: hanya baris yang punya IN/OUT di grup itu; kolom IN/OUT & sorting ikut grup tersebut.
 * - onlyActive: buang tangki tanpa aliran sama sekali.
 * Jika nilai sort sama (mis. tanggal sama), baris dengan total aliran lebih besar di atas.
 */
function filterAndSortTransactions(data, { tankSearch, product, cluster, group = ALL_GROUPS, dateFrom, dateTo, onlyActive }, sortConfig) {
    let result = [...data];

    if (tankSearch?.trim()) {
        const query = tankSearch.trim().toLowerCase();
        result = result.filter((item) => item.tank.toLowerCase().includes(query));
    }
    if (product && product !== 'Semua Produk') {
        result = result.filter((item) => item.product === product);
    }
    if (cluster && cluster !== 'Semua Cluster') {
        result = result.filter((item) => getTankCluster(item.tank) === cluster);
    }
    if (group !== ALL_GROUPS) {
        result = result.filter((item) => rowIn(item, group) > 0 || rowOut(item, group) > 0);
    } else if (onlyActive) {
        result = result.filter(hasMovement);
    }
    if (dateFrom) {
        result = result.filter((item) => item.date.slice(0, 10) >= dateFrom);
    }
    if (dateTo) {
        result = result.filter((item) => item.date.slice(0, 10) <= dateTo);
    }

    const getValue = (item) => {
        switch (sortConfig.column) {
            case 'date': return toTime(item.date);
            case 'inFlow': return rowIn(item, group);
            case 'outFlow': return rowOut(item, group);
            case 'deltaTemp': return getDelta(item) ?? -Infinity;
            default: return item[sortConfig.column];
        }
    };

    result.sort((a, b) => {
        const valA = getValue(a);
        const valB = getValue(b);
        if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
        return (rowIn(b, group) + rowOut(b, group)) - (rowIn(a, group) + rowOut(a, group));
    });

    return result;
}

function SortIcon({ active, order }) {
    if (!active) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />;
    return order === 'asc'
        ? <ArrowUp className="w-3.5 h-3.5 text-amber-600 font-bold" />
        : <ArrowDown className="w-3.5 h-3.5 text-amber-600 font-bold" />;
}

/* ── Komponen tabel bersama (dipakai widget & halaman penuh) ─────────────────── */

function HeaderCell({ column, label, sub, align = 'left', sortConfig, onSort }) {
    const justify = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';
    const textAlign = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
    const sortable = Boolean(onSort && column);
    const content = (
        <div className={`flex items-center gap-1.5 ${justify}`}>
            <div className={textAlign}>
                <span>{label}</span>
                {sub && <span className="block text-[9px] font-semibold normal-case tracking-normal text-amber-700">{sub}</span>}
            </div>
            {sortable && <SortIcon active={sortConfig.column === column} order={sortConfig.order} />}
        </div>
    );
    if (!sortable) return <th className="py-3 px-4">{content}</th>;
    return (
        <th onClick={() => onSort(column)} className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors group select-none">
            {content}
        </th>
    );
}

function GlCell({ row }) {
    const gl = Number(row.gl) || 0;
    if (gl === 0) return <span className="text-slate-300">-</span>;
    const pct = (Number(row.glPct) || 0) * 100;
    const tone = row.glFlag ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200';
    return (
        <div className="inline-flex flex-col items-end">
            <span className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold ${tone}`}>{gl > 0 ? '+' : ''}{formatNumber(gl)} KG</span>
            <span className="text-[10px] text-slate-400 mt-0.5">{pct > 0 ? '+' : ''}{pct.toFixed(2)}%</span>
        </div>
    );
}

function FlowBreakdown({ row }) {
    const ins = FLOW_GROUPS.map((g) => ({ label: g.label, value: groupIn(row, g.key) })).filter((x) => x.value > 0);
    const outs = FLOW_GROUPS.map((g) => ({ label: g.label, value: groupOut(row, g.key) })).filter((x) => x.value > 0);
    const totalIn = ins.reduce((s, x) => s + x.value, 0);
    const totalOut = outs.reduce((s, x) => s + x.value, 0);

    const FlowList = ({ title, total, items, color }) => (
        <div className="p-3 bg-white rounded-xl border border-slate-100">
            <div className="flex items-baseline justify-between gap-2">
                <p className="text-[11px] font-bold text-slate-500">{title}</p>
                <p className={`text-xs font-black ${color}`}>{formatNumber(total)} KG</p>
            </div>
            {items.length === 0 ? (
                <p className="text-[11px] text-slate-400 mt-2">Tidak ada aliran</p>
            ) : (
                <ul className="mt-2 space-y-1">
                    {items.map((x) => (
                        <li key={x.label} className="flex items-center justify-between gap-3 text-[11px]">
                            <span className="text-slate-600 font-medium">{x.label}</span>
                            <span className={`font-bold ${color}`}>{formatNumber(x.value)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    return (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-3 bg-white rounded-xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-500">Stok tangki {row.tank}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{row.productTank || row.product || '-'}</p>
                <div className="mt-2 space-y-1 text-[11px]">
                    <div className="flex justify-between gap-3"><span className="text-slate-600 font-medium">Beginning</span><span className="font-bold text-slate-800">{formatNumber(row.beginning)}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-600 font-medium">Ending</span><span className="font-bold text-slate-800">{formatNumber(row.ending)}</span></div>
                    <div className="flex justify-between gap-3 pt-1 border-t border-slate-100"><span className="text-slate-600 font-medium">Selisih stok</span><span className="font-bold text-slate-800">{formatNumber((Number(row.ending) || 0) - (Number(row.beginning) || 0))}</span></div>
                </div>
            </div>
            <FlowList title="IN dari" total={totalIn} items={ins} color="text-emerald-600" />
            <FlowList title="OUT ke" total={totalOut} items={outs} color="text-orange-600" />
            <div className="p-3 bg-white rounded-xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-500">Gain / Loss</p>
                <div className="mt-2 flex justify-end"><GlCell row={row} /></div>
                {row.glFlag && <p className="text-[10px] font-semibold text-red-600 mt-2">Di luar batas ±0,2%</p>}
                <p className="text-[11px] text-slate-500 mt-2">{row.cause || 'Tidak ada analisa penyebab.'}</p>
            </div>
        </div>
    );
}

/**
 * Tabel transaksi bersama.
 * - onSort   : jika diberikan, header kolom bisa diklik untuk sorting (halaman penuh).
 * - expandable + expandedIds + onToggle : baris bisa dibuka untuk melihat asal/tujuan aliran (halaman penuh).
 * - group    : kolom IN/OUT menampilkan angka grup terpilih (atau total jika ALL_GROUPS).
 */
function TransactionsTable({ rows, group, sortConfig, onSort, expandable = false, expandedIds, onToggle, hoverClass = 'hover:bg-slate-50/80' }) {
    const groupSub = group !== ALL_GROUPS ? getGroupLabel(group) : undefined;
    const colSpan = expandable ? 9 : 8;

    return (
        <table className="w-full text-left border-collapse text-xs">
            <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    {expandable && <th className="py-3 pl-4 pr-0 w-6" />}
                    <HeaderCell column="date" label="Tanggal" sortConfig={sortConfig} onSort={onSort} />
                    <th className="py-3 px-4">Tangki</th>
                    <th className="py-3 px-4">Product Tankfarm</th>
                    <th className="py-3 px-4">Produk</th>
                    <HeaderCell column="inFlow" label="IN Flow" sub={groupSub} align="right" sortConfig={sortConfig} onSort={onSort} />
                    <HeaderCell column="outFlow" label="OUT Flow" sub={groupSub} align="right" sortConfig={sortConfig} onSort={onSort} />
                    <th className="py-3 px-4 text-right">Suhu (°C)</th>
                    <HeaderCell column="deltaTemp" label="Δ °C" align="center" sortConfig={sortConfig} onSort={onSort} />
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {rows.map((row) => {
                    const isOpen = expandable && Boolean(expandedIds?.[row.id]);
                    const inVal = rowIn(row, group);
                    const outVal = rowOut(row, group);
                    const temp = getTemp(row);
                    const delta = getDelta(row);
                    return (
                        <React.Fragment key={row.id}>
                            <tr
                                onClick={expandable ? () => onToggle(row.id) : undefined}
                                className={`${hoverClass} transition-colors ${expandable ? 'cursor-pointer' : ''} ${isOpen ? 'bg-amber-50/40' : ''}`}
                            >
                                {expandable && (
                                    <td className="py-3 pl-4 pr-0 w-6">
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-amber-600' : ''}`} />
                                    </td>
                                )}
                                <td className="py-3 px-4 whitespace-nowrap">
                                    <div className="font-semibold text-slate-800">{formatDate(row.date)}</div>
                                    <span className="text-[10px] text-slate-400">{row.tfarm}</span>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                    <span className="font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-xs font-mono">{row.tank}</span>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                                    {row.productTank || <span className="text-slate-300">-</span>}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                    {row.product ? (
                                        <span className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold ${PRODUCT_BADGE_STYLES[row.product] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>{row.product}</span>
                                    ) : <span className="text-slate-300">-</span>}
                                </td>
                                <td className="py-3 px-4 text-right whitespace-nowrap">{inVal > 0 ? <span className="font-bold text-emerald-600">{formatNumber(inVal)} KG</span> : <span className="text-slate-300">-</span>}</td>
                                <td className="py-3 px-4 text-right whitespace-nowrap">{outVal > 0 ? <span className="font-bold text-orange-600">{formatNumber(outVal)} KG</span> : <span className="text-slate-300">-</span>}</td>
                                <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-slate-600">{temp !== null ? `${temp.toFixed(1)} °C` : '-'}</td>
                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                    {delta === null ? (
                                        <span className="text-slate-300">-</span>
                                    ) : delta === 0 ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">0.0 °C</span>
                                    ) : delta > 0 ? (
                                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">+{delta} °C</span>
                                    ) : (
                                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">{delta} °C</span>
                                    )}
                                </td>
                            </tr>
                            {isOpen && (
                                <tr className="bg-slate-50/70">
                                    <td colSpan={colSpan} className="px-4 py-3">
                                        <FlowBreakdown row={row} />
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    );
                })}
            </tbody>
        </table>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   BAGIAN 2 — WIDGET RINGKAS (untuk Overview, tampil 5 transaksi terbaru)
   Sorting dikunci ke tanggal terbaru; sorting lengkap & rincian aliran per
   grup ada di halaman penuh. Hanya tangki yang punya aliran IN/OUT yang dihitung.
═════════════════════════════════════════════════════════════════════════════ */

export function OilTransactionDetail({ filters, onViewAll, transactions }) {
    const sourceData = transactions ?? ALL_TRANSACTIONS;

    const [tankSearch, setTankSearch] = useState(DEFAULT_FILTERS.tankSearch);
    const [selectedProduct, setSelectedProduct] = useState(DEFAULT_FILTERS.product);
    const [selectedCluster, setSelectedCluster] = useState(DEFAULT_FILTERS.cluster);
    const [selectedGroup, setSelectedGroup] = useState(DEFAULT_FILTERS.group);
    const [dateFrom, setDateFrom] = useState(DEFAULT_FILTERS.dateFrom);
    const [dateTo, setDateTo] = useState(DEFAULT_FILTERS.dateTo);

    // Sinkron filter dari parent (FilterBar global). `!== undefined` dipakai
    // (bukan truthy check) supaya nilai '' dari tombol Reset tetap ikut ke-reset di sini.
    useEffect(() => {
        if (!filters) return;
        if (filters.product !== undefined) setSelectedProduct(filters.product || DEFAULT_FILTERS.product);
        if (filters.cluster !== undefined) setSelectedCluster(filters.cluster || DEFAULT_FILTERS.cluster);
        if (filters.group !== undefined) setSelectedGroup(filters.group || DEFAULT_FILTERS.group);
        if (filters.dateFrom !== undefined) setDateFrom(filters.dateFrom || '');
        if (filters.dateTo !== undefined) setDateTo(filters.dateTo || '');
    }, [filters]);

    const handleResetFilters = () => {
        setTankSearch(DEFAULT_FILTERS.tankSearch);
        setSelectedProduct(DEFAULT_FILTERS.product);
        setSelectedCluster(DEFAULT_FILTERS.cluster);
        setSelectedGroup(DEFAULT_FILTERS.group);
        setDateFrom(DEFAULT_FILTERS.dateFrom);
        setDateTo(DEFAULT_FILTERS.dateTo);
    };

    const filteredAndSortedData = useMemo(
        () => filterAndSortTransactions(
            sourceData,
            { tankSearch, product: selectedProduct, cluster: selectedCluster, group: selectedGroup, dateFrom, dateTo, onlyActive: true },
            SORT_LATEST
        ),
        [sourceData, tankSearch, selectedProduct, selectedCluster, selectedGroup, dateFrom, dateTo]
    );

    const totalItems = filteredAndSortedData.length;
    const displayedData = useMemo(() => filteredAndSortedData.slice(0, 5), [filteredAndSortedData]);
    const shownCount = displayedData.length;

    // Filter yang aktif dioper ke halaman penuh saat "Lihat Selengkapnya" diklik.
    const handleViewAllClick = () => {
        const currentFilters = {
            tankSearch, product: selectedProduct, cluster: selectedCluster, group: selectedGroup,
            dateFrom, dateTo, onlyActive: true,
        };
        if (onViewAll) onViewAll(currentFilters);
    };

    const hasActiveFilter = tankSearch || selectedProduct !== DEFAULT_FILTERS.product || selectedCluster !== DEFAULT_FILTERS.cluster
        || selectedGroup !== DEFAULT_FILTERS.group || dateFrom || dateTo;

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
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                            <span className="text-[11px] text-slate-400 font-semibold">Cluster:</span>
                            <select value={selectedCluster} onChange={(e) => setSelectedCluster(e.target.value)} className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer">
                                {CLUSTER_LIST.map((c) => <option key={c} value={c}>{c === 'Semua Cluster' ? c : `Cluster ${c}`}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                            <span className="text-[11px] text-slate-400 font-semibold">Grup:</span>
                            <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer">
                                <option value={ALL_GROUPS}>Semua Grup</option>
                                {FLOW_GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-[11px]" title="Dari Tanggal" />
                            <span className="text-slate-400">-</span>
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-[11px]" title="Sampai Tanggal" />
                        </div>
                        {hasActiveFilter && (
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
                    <TransactionsTable rows={displayedData} group={selectedGroup} />
                )}
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    <span>Menampilkan {shownCount} transaksi terbaru dari total {totalItems} data</span>
                </div>
                <span className="text-[11px] text-slate-400">Klik "Lihat Selengkapnya" untuk rincian asal/tujuan aliran</span>
            </div>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   BAGIAN 3 — HALAMAN PENUH (pagination, ringkasan statistik, baris bisa dibuka)
═════════════════════════════════════════════════════════════════════════════ */

export function OilTransactionsPage({ onBack, initialFilters, transactions }) {
    const sourceData = transactions ?? ALL_TRANSACTIONS;

    const [tankSearch, setTankSearch] = useState(initialFilters?.tankSearch ?? DEFAULT_FILTERS.tankSearch);
    const [selectedProduct, setSelectedProduct] = useState(initialFilters?.product ?? DEFAULT_FILTERS.product);
    const [selectedCluster, setSelectedCluster] = useState(initialFilters?.cluster ?? DEFAULT_FILTERS.cluster);
    const [selectedGroup, setSelectedGroup] = useState(initialFilters?.group ?? DEFAULT_FILTERS.group);
    const [dateFrom, setDateFrom] = useState(initialFilters?.dateFrom ?? DEFAULT_FILTERS.dateFrom);
    const [dateTo, setDateTo] = useState(initialFilters?.dateTo ?? DEFAULT_FILTERS.dateTo);
    const [onlyActive, setOnlyActive] = useState(initialFilters?.onlyActive ?? DEFAULT_FILTERS.onlyActive);
    const [sortConfig, setSortConfig] = useState({ column: 'date', order: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [expandedIds, setExpandedIds] = useState({});

    const handleToggleRow = (id) => setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));

    const handleSort = (column) => {
        setSortConfig((prev) =>
            prev.column === column ? { column, order: prev.order === 'asc' ? 'desc' : 'asc' } : { column, order: 'desc' }
        );
        setCurrentPage(1);
    };

    const handleResetFilters = () => {
        setTankSearch(DEFAULT_FILTERS.tankSearch);
        setSelectedProduct(DEFAULT_FILTERS.product);
        setSelectedCluster(DEFAULT_FILTERS.cluster);
        setSelectedGroup(DEFAULT_FILTERS.group);
        setDateFrom(DEFAULT_FILTERS.dateFrom);
        setDateTo(DEFAULT_FILTERS.dateTo);
        setOnlyActive(DEFAULT_FILTERS.onlyActive);
        setSortConfig({ column: 'date', order: 'desc' });
        setCurrentPage(1);
    };

    const filteredAndSortedData = useMemo(
        () => filterAndSortTransactions(
            sourceData,
            { tankSearch, product: selectedProduct, cluster: selectedCluster, group: selectedGroup, dateFrom, dateTo, onlyActive },
            sortConfig
        ),
        [sourceData, tankSearch, selectedProduct, selectedCluster, selectedGroup, dateFrom, dateTo, onlyActive, sortConfig]
    );

    // IN/OUT dihitung sesuai grup terpilih (atau semua grup).
    const stats = useMemo(() => {
        const totalIN = filteredAndSortedData.reduce((s, d) => s + rowIn(d, selectedGroup), 0);
        const totalOUT = filteredAndSortedData.reduce((s, d) => s + rowOut(d, selectedGroup), 0);
        return { totalIN, totalOUT, net: totalIN - totalOUT, count: filteredAndSortedData.length };
    }, [filteredAndSortedData, selectedGroup]);

    const totalItems = filteredAndSortedData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const displayedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedData.slice(start, start + itemsPerPage);
    }, [filteredAndSortedData, currentPage, itemsPerPage]);

    const hasActiveFilter = tankSearch || selectedProduct !== DEFAULT_FILTERS.product || selectedCluster !== DEFAULT_FILTERS.cluster
        || selectedGroup !== DEFAULT_FILTERS.group || dateFrom || dateTo || onlyActive !== DEFAULT_FILTERS.onlyActive;

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
                                <p className="text-slate-500 text-xs mt-0.5">Daftar lengkap transaksi aliran minyak masuk, keluar, tangki, dan perubahan suhu (Δ °C). Klik baris untuk melihat asal/tujuan aliran, stok, dan gain/loss.</p>
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
                    {selectedGroup !== ALL_GROUPS && (
                        <p className="text-[11px] text-amber-800 font-semibold">Angka IN/OUT dihitung khusus grup {getGroupLabel(selectedGroup)}.</p>
                    )}
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
                                    <button onClick={() => { setTankSearch(''); setCurrentPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                                <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200">
                                    <span className="text-[11px] text-slate-400 font-semibold">Produk:</span>
                                    <select value={selectedProduct} onChange={(e) => { setSelectedProduct(e.target.value); setCurrentPage(1); }} className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer">
                                        {PRODUCT_LIST.map((p) => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200">
                                    <span className="text-[11px] text-slate-400 font-semibold">Cluster:</span>
                                    <select value={selectedCluster} onChange={(e) => { setSelectedCluster(e.target.value); setCurrentPage(1); }} className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer">
                                        {CLUSTER_LIST.map((c) => <option key={c} value={c}>{c === 'Semua Cluster' ? c : `Cluster ${c}`}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200">
                                    <span className="text-[11px] text-slate-400 font-semibold">Grup:</span>
                                    <select value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setCurrentPage(1); }} className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer">
                                        <option value={ALL_GROUPS}>Semua Grup</option>
                                        {FLOW_GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-xl border border-slate-200">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }} className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-[11px]" title="Dari Tanggal" />
                                    <span className="text-slate-400">-</span>
                                    <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }} className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-[11px]" title="Sampai Tanggal" />
                                </div>
                                <label className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200 cursor-pointer select-none" title="Sembunyikan tangki yang tidak punya aliran IN/OUT pada tanggal tersebut">
                                    <input type="checkbox" checked={onlyActive} onChange={(e) => { setOnlyActive(e.target.checked); setCurrentPage(1); }} className="accent-amber-500 cursor-pointer" />
                                    <span className="text-[11px] text-slate-600 font-semibold">Hanya yang ada aliran</span>
                                </label>
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
                            <TransactionsTable
                                rows={displayedData}
                                group={selectedGroup}
                                sortConfig={sortConfig}
                                onSort={handleSort}
                                expandable
                                expandedIds={expandedIds}
                                onToggle={handleToggleRow}
                                hoverClass="hover:bg-amber-50/30"
                            />
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