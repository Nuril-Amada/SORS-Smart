import React, { useState, useMemo } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { PieChart as PieIcon, ChevronDown } from 'lucide-react';

/* ─────────────────────────────────────────
   Color palette
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
   Grouping options & mock data generators
───────────────────────────────────────── */
const GROUP_OPTIONS = [
    { id: 'product', label: 'Jenis Produk' },
    { id: 'cluster', label: 'Cluster Tank' },
    { id: 'tank',    label: 'Tangki' },
];

function genProductData() {
    return [
        { name: 'CPO',         value: 18450.5 },
        { name: 'RBD Olein',   value: 12340.2 },
        { name: 'RBD Stearin', value:  7820.8 },
        { name: 'PKO',         value:  5610.0 },
        { name: 'PFAD',        value:  3200.5 },
        { name: 'RBDPO',       value:  1980.0 },
    ];
}

function genClusterData() {
    return [
        { name: 'Cluster A', value: 15320.0 },
        { name: 'Cluster B', value: 13480.5 },
        { name: 'Cluster C', value: 10280.2 },
        { name: 'Cluster D', value:  8120.8 },
        { name: 'Cluster E', value:  2200.5 },
    ];
}

function genTankData() {
    return Array.from({ length: 6 }, (_, i) => ({
        name: `Tangki ${String(i + 1).padStart(2, '0')}`,
        value: Math.round(3000 + Math.random() * 7000),
    }));
}

function getDataByGroup(group) {
    if (group === 'product') return genProductData();
    if (group === 'cluster') return genClusterData();
    return genTankData();
}

/* ─────────────────────────────────────────
   Custom Tooltip
───────────────────────────────────────── */
function CustomTooltip({ active, payload, total }) {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    const pct  = ((item.value / total) * 100).toFixed(1);
    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-3.5 shadow-2xl min-w-[170px]">
            <p className="text-xs font-bold text-white mb-1">{item.name}</p>
            <p className="text-amber-400 text-sm font-black">{item.value.toLocaleString('id-ID', { minimumFractionDigits: 1 })} MT</p>
            <p className="text-slate-400 text-[11px] mt-0.5">{pct}% dari total stok</p>
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
                    {value.toLocaleString('id-ID', { minimumFractionDigits: 1 })}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">MT</span>
                <span className="text-[10px] text-amber-500 ml-2 font-semibold">{pct}%</span>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   StockDistributionChart component
───────────────────────────────────────── */
export default function StockDistributionChart({ filters }) {
    const [group, setGroup] = useState('product');
    const [dropOpen, setDropOpen] = useState(false);

    const data  = useMemo(() => getDataByGroup(group), [group]);
    const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

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
                                {total.toLocaleString('id-ID', { minimumFractionDigits: 1 })} MT
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
                                    onClick={() => { setGroup(opt.id); setDropOpen(false); }}
                                    className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors ${
                                        group === opt.id
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
            <div className="px-5 py-5 flex flex-col md:flex-row gap-6 items-start">
                {/* Donut */}
                <div className="w-full md:w-[220px] shrink-0 flex justify-center">
                    <ResponsiveContainer width={220} height={220}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={62}
                                outerRadius={96}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={(props) => <CustomTooltip {...props} total={total} />} />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center label */}
                    <div className="absolute flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: '70px', marginLeft: '-110px' }}>
                        {/* Empty — recharts centers the hole */}
                    </div>
                </div>

                {/* Legend table */}
                <div className="flex-1 w-full">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Rincian · {GROUP_OPTIONS.find(g => g.id === group)?.label}
                    </p>
                    <div className="space-y-0.5">
                        {data.map((item, i) => (
                            <LegendItem
                                key={item.name}
                                name={item.name}
                                value={item.value}
                                color={COLORS[i % COLORS.length]}
                                pct={((item.value / total) * 100).toFixed(1)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
