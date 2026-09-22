import React, { useState, useMemo } from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { TrendingUp, BarChart2, ChevronDown } from 'lucide-react';

/* ─────────────────────────────────────────
   Mock data generator — keyed by filter
   In production: fetch from API with filters
───────────────────────────────────────── */
function generateWeeklyData(filters) {
    const baseIN  = [1820, 2340, 1950, 2810, 2100, 1760, 2450];
    const baseOUT = [1400, 1780, 2100, 1920, 1650, 2050, 1870];

    return baseIN.map((inVal, i) => {
        // slight randomness per filter combo
        const seed = (filters.product.length + filters.cluster.length + i) % 5;
        const _in  = Math.round(inVal  * (0.85 + seed * 0.07));
        const _out = Math.round(baseOUT[i] * (0.85 + seed * 0.06));
        return {
            week: `Minggu ${i + 1}`,
            weekLabel: `W${i + 1}`,
            IN:  _in,
            OUT: _out,
            Selisih: _in - _out,
        };
    });
}

/* ─────────────────────────────────────────
   Custom Tooltip
───────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const selisih = (payload.find(p => p.dataKey === 'IN')?.value ?? 0)
                  - (payload.find(p => p.dataKey === 'OUT')?.value ?? 0);
    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-3.5 shadow-2xl min-w-[180px]">
            <p className="text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-2.5">
                {label}
            </p>
            {payload.map(p => (
                p.dataKey !== 'Selisih' && (
                    <div key={p.dataKey} className="flex items-center justify-between gap-6 mb-1">
                        <span className="text-slate-400 text-xs flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: p.color }} />
                            {p.dataKey}
                        </span>
                        <span className="text-white text-xs font-bold">
                            {p.value.toLocaleString('id-ID')} MT
                        </span>
                    </div>
                )
            ))}
            <div className="mt-2 pt-2 border-t border-slate-700 flex items-center justify-between">
                <span className="text-slate-400 text-xs">Selisih</span>
                <span className={`text-xs font-bold ${selisih >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selisih >= 0 ? '+' : ''}{selisih.toLocaleString('id-ID')} MT
                </span>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   Chart Type Toggle
───────────────────────────────────────── */
const CHART_TYPES = [
    { id: 'composed', label: 'Bar + Line' },
    { id: 'bar',      label: 'Bar' },
    { id: 'line',     label: 'Line' },
];

/* ─────────────────────────────────────────
   WeeklyTrendChart component
───────────────────────────────────────── */
export default function WeeklyTrendChart({ filters }) {
    const [chartType, setChartType] = useState('composed');
    const data = useMemo(() => generateWeeklyData(filters), [filters]);

    const totalIN  = data.reduce((s, d) => s + d.IN,  0);
    const totalOUT = data.reduce((s, d) => s + d.OUT, 0);
    const trend    = totalIN - totalOUT;

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* ── Header ── */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Tren Transaksi Mingguan</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Volume IN &amp; OUT per minggu · Satuan: MT
                        </p>
                    </div>
                </div>

                {/* Summary badges + chart type */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
                        IN {totalIN.toLocaleString('id-ID')} MT
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-[11px] font-bold text-orange-700">
                        OUT {totalOUT.toLocaleString('id-ID')} MT
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                        trend >= 0
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-red-50 border-red-200 text-red-600'
                    }`}>
                        {trend >= 0 ? '+' : ''}{trend.toLocaleString('id-ID')} MT
                    </span>

                    {/* Chart type selector */}
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden text-[11px] font-semibold">
                        {CHART_TYPES.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setChartType(t.id)}
                                className={`px-2.5 py-1 transition-colors ${
                                    chartType === t.id
                                        ? 'bg-slate-800 text-white'
                                        : 'bg-white text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Chart ── */}
            <div className="px-5 py-5">
                <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                            dataKey="weekLabel"
                            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={v => `${(v / 1000).toFixed(1)}k`}
                            width={40}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Legend
                            wrapperStyle={{ fontSize: 11, paddingTop: 16 }}
                            formatter={(value) => <span className="text-slate-600 font-semibold">{value}</span>}
                        />
                        <ReferenceLine y={0} stroke="#e2e8f0" />

                        {/* Bar mode */}
                        {chartType === 'bar' && (
                            <>
                                <Bar dataKey="IN"  fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                                <Bar dataKey="OUT" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={36} />
                            </>
                        )}

                        {/* Line mode */}
                        {chartType === 'line' && (
                            <>
                                <Line dataKey="IN"  stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                                <Line dataKey="OUT" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6 }} />
                            </>
                        )}

                        {/* Composed mode: Bar IN + Bar OUT + Line Selisih */}
                        {chartType === 'composed' && (
                            <>
                                <Bar dataKey="IN"  fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                                <Bar dataKey="OUT" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={36} />
                                <Line
                                    dataKey="Selisih"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    strokeDasharray="5 3"
                                    dot={{ r: 3.5, fill: '#6366f1' }}
                                    activeDot={{ r: 5 }}
                                />
                            </>
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* ── Footer note ── */}
            <div className="px-5 pb-4 flex items-center gap-2">
                <span className="w-2.5 h-0.5 rounded-full bg-indigo-400 inline-block" />
                <span className="text-[10px] text-slate-400 font-medium">
                    Garis putus-putus = Selisih (IN − OUT) per minggu
                </span>
            </div>
        </div>
    );
}
