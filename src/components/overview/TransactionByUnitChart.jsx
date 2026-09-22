import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { BarChart2 } from 'lucide-react';

/* ─────────────────────────────────────────
   Grouping tabs
───────────────────────────────────────── */
const TABS = [
    { id: 'unit',    label: 'Unit Kerja' },
    { id: 'cluster', label: 'Cluster Tank' },
    { id: 'tank',    label: 'Tangki' },
];

/* ─────────────────────────────────────────
   Mock data generators
   In production: replace with API call + filters
───────────────────────────────────────── */
function genByUnit() {
    return [
        { name: 'Produksi',    IN: 8420,  OUT: 6310,  count: 128 },
        { name: 'Gudang',      IN: 5830,  OUT: 4920,  count:  97 },
        { name: 'Distribusi',  IN: 3210,  OUT: 4180,  count:  74 },
        { name: 'QC',          IN: 1540,  OUT: 1220,  count:  43 },
        { name: 'Ekspor',      IN: 2980,  OUT: 3750,  count:  61 },
    ];
}

function genByCluster() {
    return [
        { name: 'Cluster A', IN: 5820, OUT: 4310, count:  98 },
        { name: 'Cluster B', IN: 4930, OUT: 5120, count:  87 },
        { name: 'Cluster C', IN: 3410, OUT: 2980, count:  63 },
        { name: 'Cluster D', IN: 2840, OUT: 3200, count:  54 },
        { name: 'Cluster E', IN: 1980, OUT: 1770, count:  38 },
    ];
}

function genByTank() {
    return Array.from({ length: 8 }, (_, i) => {
        const _in  = Math.round(800 + (i % 3) * 600 + i * 120);
        const _out = Math.round(700 + (i % 4) * 450 + i * 90);
        return {
            name: `Tki-${String(i + 1).padStart(2, '0')}`,
            IN:   _in,
            OUT:  _out,
            count: 10 + i * 3,
        };
    });
}

function getData(tab) {
    if (tab === 'unit')    return genByUnit();
    if (tab === 'cluster') return genByCluster();
    return genByTank();
}

/* ─────────────────────────────────────────
   Custom Tooltip
───────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const inVal  = payload.find(p => p.dataKey === 'IN')?.value  ?? 0;
    const outVal = payload.find(p => p.dataKey === 'OUT')?.value ?? 0;
    const selisih = inVal - outVal;

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-3.5 shadow-2xl min-w-[200px]">
            <p className="text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-3">{label}</p>
            <div className="space-y-1.5">
                <div className="flex justify-between gap-6">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        Volume IN
                    </span>
                    <span className="text-xs font-bold text-white">{inVal.toLocaleString('id-ID')} MT</span>
                </div>
                <div className="flex justify-between gap-6">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                        Volume OUT
                    </span>
                    <span className="text-xs font-bold text-white">{outVal.toLocaleString('id-ID')} MT</span>
                </div>
                <div className="flex justify-between gap-6">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />
                        Jml. Transaksi
                    </span>
                    <span className="text-xs font-bold text-white">
                        {payload[0]?.payload?.count?.toLocaleString('id-ID')} trx
                    </span>
                </div>
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-slate-700 flex justify-between">
                <span className="text-xs text-slate-400">Selisih</span>
                <span className={`text-xs font-bold ${selisih >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selisih >= 0 ? '+' : ''}{selisih.toLocaleString('id-ID')} MT
                </span>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   Summary row component
───────────────────────────────────────── */
function SummaryRow({ data }) {
    const totalIN    = data.reduce((s, d) => s + d.IN,    0);
    const totalOUT   = data.reduce((s, d) => s + d.OUT,   0);
    const totalCount = data.reduce((s, d) => s + d.count, 0);
    const selisih    = totalIN - totalOUT;

    const items = [
        { label: 'Total IN',       value: `${totalIN.toLocaleString('id-ID')} MT`,    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        { label: 'Total OUT',      value: `${totalOUT.toLocaleString('id-ID')} MT`,   color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200' },
        { label: 'Transaksi',      value: `${totalCount.toLocaleString('id-ID')} trx`,color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-200' },
        {
            label: 'Net Selisih',
            value: `${selisih >= 0 ? '+' : ''}${selisih.toLocaleString('id-ID')} MT`,
            color: selisih >= 0 ? 'text-blue-600' : 'text-red-600',
            bg: selisih >= 0 ? 'bg-blue-50' : 'bg-red-50',
            border: selisih >= 0 ? 'border-blue-200' : 'border-red-200',
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 pb-5">
            {items.map(item => (
                <div key={item.label} className={`${item.bg} border ${item.border} rounded-xl px-4 py-3 text-center`}>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-0.5">{item.label}</p>
                    <p className={`text-sm font-black ${item.color}`}>{item.value}</p>
                </div>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────
   TransactionByUnitChart component
───────────────────────────────────────── */
export default function TransactionByUnitChart({ filters }) {
    const [activeTab, setActiveTab] = useState('unit');
    const data = useMemo(() => getData(activeTab), [activeTab]);

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* ── Header ── */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                        <BarChart2 className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Transaksi per {TABS.find(t => t.id === activeTab)?.label}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Volume IN &amp; OUT · Jumlah Transaksi · Satuan: MT
                        </p>
                    </div>
                </div>

                {/* Tab switcher */}
                <div className="flex rounded-xl border border-slate-200 overflow-hidden text-[11px] font-bold">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            id={`tab-by-${tab.id}`}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-1.5 transition-all duration-150 ${
                                activeTab === tab.id
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-white text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Bar Chart ── */}
            <div className="px-5 pt-5 pb-2">
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                        data={data}
                        margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
                        barCategoryGap="30%"
                        barGap={4}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={v => `${(v / 1000).toFixed(v >= 1000 ? 1 : 0)}${v >= 1000 ? 'k' : ''}`}
                            width={36}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Legend
                            wrapperStyle={{ fontSize: 11, paddingTop: 14 }}
                            formatter={(value) => (
                                <span className="text-slate-600 font-semibold">Volume {value}</span>
                            )}
                        />
                        <Bar dataKey="IN"  fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="OUT" fill="#f97316" radius={[5, 5, 0, 0]} maxBarSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* ── Summary row ── */}
            <SummaryRow data={data} />
        </div>
    );
}
