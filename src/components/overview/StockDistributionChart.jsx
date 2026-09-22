import React, { useState, useMemo } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import { PieChart as PieIcon, ChevronDown, Inbox } from 'lucide-react';

/* ─────────────────────────────────────────
   Color palette untuk potongan donat
───────────────────────────────────────── */
const COLORS = [
    '#f59e0b', // amber
    '#10b981', // emerald
    '#6366f1', // indigo
    '#f97316', // orange
    '#0ea5e9', // sky
    '#ec4899', // pink
    '#84cc16', // lime
    '#8b5cf6', // violet
];

/* ─────────────────────────────────────────
   Grouping options
───────────────────────────────────────── */
const GROUP_OPTIONS = [
    { id: 'product', label: 'Jenis Produk' },
    { id: 'cluster', label: 'Cluster Tank' },
    { id: 'tank', label: 'Tangki' },
];

/* ─────────────────────────────────────────
   Presentational only — TIDAK ada data dummy
   dan TIDAK fetch apa pun di sini.

   `data` datang dari parent (hasil fetch API / DB),
   bisa berbentuk array:
   [
     { name: 'CPO', value: 18450.5 },
     { name: 'RBD Olein', value: 12340.2 },
     ...
   ]

   Atau object terkelompok:
   {
     product: [{ name: 'CPO', value: 18450.5 }, ...],
     cluster: [{ name: 'Cluster A', value: 15320.0 }, ...],
     tank:    [{ name: 'Tangki 01', value: 4500.0 }, ...]
   }

   Contoh pemakaian di parent:
     const [data, setData] = useState([]);
     useEffect(() => {
       fetch(`/api/stock-distribution?...`).then(r => r.json()).then(setData);
     }, [filters]);
     ...
     <StockDistributionChart data={data} />
───────────────────────────────────────── */

/* ─────────────────────────────────────────
   Custom Tooltip — tema putih agak cream
───────────────────────────────────────── */
function CustomTooltip({ active, payload, total }) {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
    return (
        <div className="bg-[#fefcf8]/95 border border-amber-200/60 rounded-xl p-3.5 shadow-xl min-w-[175px] backdrop-blur-sm">
            <p className="text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                {item.name}
            </p>
            <div className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                    <span className="text-stone-600 text-xs font-medium">Volume Stok</span>
                    <span className="text-stone-900 text-xs font-bold">
                        {Number(item.value || 0).toLocaleString('id-ID', { minimumFractionDigits: 1 })} KG
                    </span>
                </div>
                <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-amber-100">
                    <span className="text-stone-500 text-[11px]">Proporsi</span>
                    <span className="text-amber-700 text-xs font-bold">{pct}%</span>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   Custom legend row
───────────────────────────────────────── */
function LegendItem({ name, value, color, pct }) {
    return (
        <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-2 min-w-0">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: color }} />
                <span className="text-xs text-slate-600 font-medium truncate">{name}</span>
            </div>
            <div className="text-right shrink-0">
                <span className="text-xs font-bold text-slate-800">
                    {Number(value || 0).toLocaleString('id-ID', { minimumFractionDigits: 1 })}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">KG</span>
                <span className="text-[10px] text-amber-500 ml-2 font-semibold">{pct}%</span>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   Empty state jika data belum ada / belum terhubung DB
───────────────────────────────────────── */
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-2 h-[220px] w-full text-slate-400">
            <Inbox className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-semibold">Belum ada data distribusi stok</p>
            <p className="text-xs text-slate-400">Data akan tampil otomatis setelah terhubung dengan database</p>
        </div>
    );
}

/* ─────────────────────────────────────────
   StockDistributionChart component
───────────────────────────────────────── */
export default function StockDistributionChart({ data = [], filters, onGroupChange }) {
    const [group, setGroup] = useState('product');
    const [dropOpen, setDropOpen] = useState(false);

    // Ambil data sesuai format (array langsung atau object per grup)
    const chartData = useMemo(() => {
        if (Array.isArray(data)) return data;
        if (data && typeof data === 'object' && Array.isArray(data[group])) {
            return data[group];
        }
        return [];
    }, [data, group]);

    const total = useMemo(() => chartData.reduce((s, d) => s + (Number(d.value) || 0), 0), [chartData]);

    const handleSelectGroup = (groupId) => {
        setGroup(groupId);
        setDropOpen(false);
        if (onGroupChange) {
            onGroupChange(groupId);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* ── Header ── */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <PieIcon className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Distribusi Stok Minyak</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Total stok akhir ·{' '}
                            <span className="font-bold text-slate-700">
                                {total.toLocaleString('id-ID', { minimumFractionDigits: 1 })} KG
                            </span>
                        </p>
                    </div>
                </div>

                {/* Group selector */}
                <div className="relative">
                    <button
                        onClick={() => setDropOpen(v => !v)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors"
                    >
                        Kelompokkan: {GROUP_OPTIONS.find(g => g.id === group)?.label}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {dropOpen && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-slate-100 shadow-xl z-20 overflow-hidden min-w-[160px]">
                            {GROUP_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleSelectGroup(opt.id)}
                                    className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors ${group === opt.id
                                            ? 'bg-amber-50 text-amber-700'
                                            : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Chart + Legend ── */}
            <div className="px-5 py-5">
                {chartData.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Donut */}
                        <div className="w-full md:w-[220px] shrink-0 flex justify-center">
                            <ResponsiveContainer width={220} height={220}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={62}
                                        outerRadius={96}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {chartData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={(props) => <CustomTooltip {...props} total={total} />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend table */}
                        <div className="flex-1 w-full">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                Rincian · {GROUP_OPTIONS.find(g => g.id === group)?.label}
                            </p>
                            <div className="space-y-0.5">
                                {chartData.map((item, i) => (
                                    <LegendItem
                                        key={item.name || i}
                                        name={item.name}
                                        value={item.value}
                                        color={COLORS[i % COLORS.length]}
                                        pct={total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
