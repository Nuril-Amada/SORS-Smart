import React, { useState, useMemo, useEffect } from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BarChart2, Inbox, Activity } from 'lucide-react';

/* ─────────────────────────────────────────
   Grouping tabs
───────────────────────────────────────── */
const TABS = [
    { id: 'unit', label: 'Unit Kerja' },
    { id: 'cluster', label: 'Cluster Tank' },
    { id: 'tank', label: 'Tangki' },
];

/* ─────────────────────────────────────────
   Helper: Format sumbu Y (Juta = M, Ribu = k)
───────────────────────────────────────── */
function formatYAxisVolume(v) {
    const abs = Math.abs(v);
    if (abs >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `${(v / 1000).toFixed(0)}k`;
    return `${v}`;
}

/* ─────────────────────────────────────────
   Custom Tooltip — tema putih agak cream
───────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const inVal = payload.find(p => p.dataKey === 'IN')?.value ?? 0;
    const outVal = payload.find(p => p.dataKey === 'OUT')?.value ?? 0;
    const countVal = payload.find(p => p.dataKey === 'count')?.value ?? payload[0]?.payload?.count;
    const selisih = inVal - outVal;

    return (
        <div className="bg-[#fefcf8]/95 border border-amber-200/60 rounded-xl p-3.5 shadow-xl min-w-[200px] backdrop-blur-sm">
            <p className="text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-2.5">
                {label}
            </p>
            <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-6">
                    <span className="text-xs text-stone-600 flex items-center gap-1.5 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        Volume IN
                    </span>
                    <span className="text-xs font-bold text-stone-900">
                        {Number(inVal).toLocaleString('id-ID')} KG
                    </span>
                </div>
                <div className="flex items-center justify-between gap-6">
                    <span className="text-xs text-stone-600 flex items-center gap-1.5 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                        Volume OUT
                    </span>
                    <span className="text-xs font-bold text-stone-900">
                        {Number(outVal).toLocaleString('id-ID')} KG
                    </span>
                </div>
                {countVal !== undefined && (
                    <div className="flex items-center justify-between gap-6">
                        <span className="text-xs text-stone-600 flex items-center gap-1.5 font-medium">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                            Jml. Transaksi
                        </span>
                        <span className="text-xs font-bold text-stone-900">
                            {Number(countVal).toLocaleString('id-ID')} Transaksi
                        </span>
                    </div>
                )}
            </div>
            <div className="mt-2.5 pt-2 border-t border-amber-100 flex items-center justify-between">
                <span className="text-xs text-stone-500 font-medium">Selisih IN - OUT</span>
                <span className={`text-xs font-bold ${selisih >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {selisih >= 0 ? '+' : ''}{Number(selisih).toLocaleString('id-ID')} KG
                </span>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   Summary row component
───────────────────────────────────────── */
function SummaryRow({ data }) {
    const totalIN = data.reduce((s, d) => s + (Number(d.IN) || 0), 0);
    const totalOUT = data.reduce((s, d) => s + (Number(d.OUT) || 0), 0);
    const totalCount = data.reduce((s, d) => s + (Number(d.count) || 0), 0);
    const selisih = totalIN - totalOUT;

    const items = [
        { label: 'Total IN', value: totalIN.toLocaleString('id-ID'), unit: 'KG', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        { label: 'Total OUT', value: totalOUT.toLocaleString('id-ID'), unit: 'KG', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
        ...(totalCount > 0 ? [{ label: 'Total Transaksi', value: totalCount.toLocaleString('id-ID'), unit: 'Transaksi', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' }] : []),
        {
            label: 'Net Selisih',
            value: `${selisih >= 0 ? '+' : ''}${selisih.toLocaleString('id-ID')}`,
            unit: 'KG',
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
                    <p className={`text-base font-black ${item.color}`}>{item.value}</p>
                    <p className={`text-xs font-bold ${item.color} mt-0.5`}>{item.unit}</p>
                </div>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────
   Empty state jika data belum ada / belum terhubung DB
───────────────────────────────────────── */
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-2 h-[260px] text-slate-400">
            <Inbox className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-semibold">Belum ada data transaksi</p>
            <p className="text-xs text-slate-400">Data akan tampil otomatis setelah terhubung dengan database</p>
        </div>
    );
}

/* ─────────────────────────────────────────
   TransactionByUnitChart component
───────────────────────────────────────── */
export default function TransactionByUnitChart({ data = [], filters, onTabChange }) {
    const [activeTab, setActiveTab] = useState('unit');
    const [showCountLine, setShowCountLine] = useState(true);

    // Ambil data sesuai format (array langsung atau object per tab)
    const chartData = useMemo(() => {
        if (Array.isArray(data)) return data;
        if (data && typeof data === 'object' && Array.isArray(data[activeTab])) {
            return data[activeTab];
        }
        return [];
    }, [data, activeTab]);

    const handleSelectTab = (tabId) => {
        setActiveTab(tabId);
        if (onTabChange) {
            onTabChange(tabId);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* ── Header ── */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                        <BarChart2 className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Transaksi per {TABS.find(t => t.id === activeTab)?.label}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Volume IN &amp; OUT (Batang){showCountLine ? ' & Jml Transaksi (Garis Ungu)' : ''}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Toggle Garis Transaksi */}
                    <button
                        onClick={() => setShowCountLine(!showCountLine)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${showCountLine
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                            }`}
                        title="Tampilkan / Sembunyikan Garis Jumlah Transaksi"
                    >
                        <Activity className="w-3.5 h-3.5" />
                        <span>{showCountLine ? 'Garis Transaksi ON' : 'Garis Transaksi OFF'}</span>
                    </button>

                    {/* Tab switcher */}
                    <div className="flex rounded-xl border border-slate-200 overflow-hidden text-[11px] font-bold">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                id={`tab-by-${tab.id}`}
                                onClick={() => handleSelectTab(tab.id)}
                                className={`px-3 py-1.5 transition-all duration-150 ${activeTab === tab.id
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-white text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="px-5 pt-5 pb-2">
                {chartData.length === 0 ? (
                    <EmptyState />
                ) : (
                    <>
                        <div className="w-full h-[310px] min-w-0">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <ComposedChart
                                    data={chartData}
                                    margin={{ top: 4, right: showCountLine ? 16 : 0, left: 0, bottom: 10 }}
                                    barCategoryGap="25%"
                                    barGap={4}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
                                        axisLine={false}
                                        tickLine={false}
                                        interval={0}
                                        angle={-20}
                                        textAnchor="end"
                                        height={55}
                                    />
                                    {/* Sumbu Kiri: Volume (KG) */}
                                    <YAxis
                                        yAxisId="left"
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={formatYAxisVolume}
                                        width={45}
                                    />
                                    {/* Sumbu Kanan: Jumlah Transaksi (Count) jika Garis ON */}
                                    {showCountLine && (
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            tick={{ fontSize: 10, fill: '#6366f1' }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={v => `${v}`}
                                            width={35}
                                        />
                                    )}
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fffbeb' }} />
                                    <Legend
                                        wrapperStyle={{ fontSize: 11, paddingTop: 14 }}
                                        formatter={(value) => (
                                            <span className="text-slate-600 font-semibold">
                                                {value === 'IN' ? 'Volume IN' : value === 'OUT' ? 'Volume OUT' : value === 'count' ? 'Jml. Transaksi' : value}
                                            </span>
                                        )}
                                    />
                                    <Bar yAxisId="left" dataKey="IN" name="IN" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                                    <Bar yAxisId="left" dataKey="OUT" name="OUT" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
                                    {showCountLine && (
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="count"
                                            name="count"
                                            stroke="#6366f1"
                                            strokeWidth={2.5}
                                            dot={{ r: 4, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                                            activeDot={{ r: 6, strokeWidth: 2, stroke: '#ffffff' }}
                                        />
                                    )}
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>


                        {/* ── Summary row ── */}
                        <div className="mt-4">
                            <SummaryRow data={chartData} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
