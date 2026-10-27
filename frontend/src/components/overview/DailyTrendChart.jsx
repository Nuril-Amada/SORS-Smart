import React, { useState, useEffect } from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { TrendingUp, Inbox } from 'lucide-react';

/* ─────────────────────────────────────────
   Presentational only — TIDAK ada data dummy
   dan TIDAK fetch apa pun di sini.

   `data` datang dari parent (hasil fetch API / DB),
   bentuknya array HARIAN, contoh:

   [
     { date: '2026-09-01', IN: 1820, OUT: 1400, EndingStock: 46650.5 },
     { date: '2026-09-02', IN: 2340, OUT: 1780, EndingStock: 47210.5 },
     ...
   ]

   `date` harus string yang bisa di-parse Date (format ISO
   "YYYY-MM-DD" paling aman), atau boleh juga langsung
   kirim field `dateLabel` siap-tampil dari backend.

   Asumsi: `data` sudah terurut naik berdasarkan tanggal
   (dari yang paling lama ke paling baru) — dibutuhkan supaya
   agregasi Bulan/Tahun & Ending Stock terakhir per periode benar.

   Contoh pemakaian di parent:

     const [data, setData] = useState([]);
     useEffect(() => {
       fetch(`/api/transaksi-harian?...`)
         .then(r => r.json())
         .then(setData);
     }, [filters]);
     ...
     <DailyTrendChart data={data} />

   ── Filter Periode (Hari/Bulan/Tahun) ──
   Filter ini murni tampilan: data harian yang sudah ada di-agregasi
   ulang di komponen ini (client-side), TIDAK fetch ulang ke backend.
   Cocok untuk rentang tanggal yang tidak terlalu panjang. Kalau nanti
   rentang datanya bisa sangat panjang (mis. beberapa tahun) dan mau
   backend yang mengagregasi langsung, tinggal tambahkan prop
   `onPeriodChange` di sini dan panggil API berbeda dari parent.
───────────────────────────────────────── */

/* ─────────────────────────────────────────
   Custom Tooltip — tema putih agak cream
───────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;

    const seriesColor = {
        IN: '#10b981',
        OUT: '#ef4444',
        EndingStock: '#d97706',
    };

    return (
        <div className="bg-[#fefcf8]/95 border border-amber-200/60 rounded-xl p-3.5 shadow-xl min-w-[190px] backdrop-blur-sm">
            <p className="text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-2.5">
                {label}
            </p>
            {payload.map(p => (
                <div key={p.dataKey} className="flex items-center justify-between gap-6 mb-1 last:mb-0">
                    <span className="text-stone-600 text-xs flex items-center gap-1.5 font-medium">
                        <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ background: p.color || seriesColor[p.dataKey] }}
                        />
                        {p.dataKey === 'EndingStock' ? 'Ending Stock' : p.dataKey}
                    </span>
                    <span className="text-stone-900 text-xs font-bold">
                        {p.value.toLocaleString('id-ID')} KG
                    </span>
                </div>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────
   Helper: format tanggal jadi label singkat (mis. "1 Sep")
───────────────────────────────────────── */
function formatDateLabel(raw) {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw; // fallback kalau formatnya sudah string siap-pakai
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(d);
}

/* ─────────────────────────────────────────
   Helper: agregasi data harian -> Hari / Bulan / Tahun

   - 'hari'  : dipakai apa adanya (cuma nambah dateLabel)
   - 'bulan' : IN & OUT dijumlah per bulan, EndingStock pakai nilai
               TERAKHIR di bulan itu (karena saldo kumulatif, bukan volume)
   - 'tahun' : sama seperti bulan, tapi dikelompokkan per tahun
───────────────────────────────────────── */
function aggregateData(data, period) {
    if (period === 'hari') {
        return data.map(d => ({
            ...d,
            dateLabel: d.dateLabel ?? formatDateLabel(d.date),
        }));
    }

    const buckets = new Map();

    data.forEach(d => {
        const date = new Date(d.date);
        if (isNaN(date.getTime())) return;

        let key, label;
        if (period === 'bulan') {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            label = new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit' }).format(date);
        } else {
            // tahun
            key = `${date.getFullYear()}`;
            label = key;
        }

        if (!buckets.has(key)) {
            buckets.set(key, { dateLabel: label, IN: 0, OUT: 0, EndingStock: 0, _sortKey: key });
        }
        const bucket = buckets.get(key);
        bucket.IN += d.IN ?? 0;
        bucket.OUT += d.OUT ?? 0;
        // Ending Stock = nilai TERAKHIR dalam periode itu (bukan dijumlah)
        bucket.EndingStock = d.EndingStock ?? bucket.EndingStock;
    });

    return Array.from(buckets.values()).sort((a, b) => a._sortKey.localeCompare(b._sortKey));
}

/* ─────────────────────────────────────────
   Chart Type Toggle — IN/OUT bisa Bar atau Line,
   Ending Stock selalu tampil sebagai garis (sumbu kanan)
───────────────────────────────────────── */
const CHART_TYPES = [
    { id: 'bar', label: 'Bar' },
    { id: 'line', label: 'Line' },
];

/* ─────────────────────────────────────────
   Filter Periode Toggle — Hari / Bulan / Tahun
───────────────────────────────────────── */
const PERIOD_OPTIONS = [
    { value: 'hari', label: 'Hari' },
    { value: 'bulan', label: 'Bulan' },
    { value: 'tahun', label: 'Tahun' },
];

/* ─────────────────────────────────────────
   Empty state
───────────────────────────────────────── */
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-2 h-[280px] text-slate-400">
            <Inbox className="w-8 h-8" />
            <p className="text-sm font-semibold">Belum ada data transaksi harian</p>
        </div>
    );
}

/* ─────────────────────────────────────────
   DailyTrendChart component
───────────────────────────────────────── */
export default function DailyTrendChart({ data = [] }) {
    const [chartType, setChartType] = useState('bar');
    const [filterPeriod, setFilterPeriod] = useState('hari');

    const chartData = aggregateData(data, filterPeriod);

    const totalIN = data.reduce((s, d) => s + (d.IN ?? 0), 0);
    const totalOUT = data.reduce((s, d) => s + (d.OUT ?? 0), 0);
    const trend = totalIN - totalOUT;
    const lastEndingStock = data.length ? data[data.length - 1].EndingStock : null;

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* ── Header ── */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Tren Transaksi</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Volume IN, OUT &amp; Ending Stock
                        </p>
                    </div>
                </div>

                {/* Summary badges — hanya masuk akal kalau ada datanya */}
                <div className="flex items-center gap-2 flex-wrap">
                    {data.length > 0 && (
                        <>
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
                                IN {totalIN.toLocaleString('id-ID')} KG
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-600">
                                OUT {totalOUT.toLocaleString('id-ID')} KG
                            </span>
                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${trend >= 0
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-red-50 border-red-200 text-red-600'
                                }`}>
                                {trend >= 0 ? '+' : ''}{trend.toLocaleString('id-ID')} KG
                            </span>
                            {lastEndingStock !== null && (
                                <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-700">
                                    Ending Stock {lastEndingStock.toLocaleString('id-ID')} KG
                                </span>
                            )}
                        </>
                    )}

                    {/* Filter Periode: Hari / Bulan / Tahun — SELALU tampil, walau data masih kosong */}
                    <select
                        value={filterPeriod}
                        onChange={e => setFilterPeriod(e.target.value)}
                        className="border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 focus:outline-none focus:border-amber-400 cursor-pointer bg-white"
                    >
                        {PERIOD_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>

                    {/* Chart type selector — SELALU tampil juga */}
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden text-[11px] font-semibold">
                        {CHART_TYPES.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setChartType(t.id)}
                                className={`px-2.5 py-1 transition-colors ${chartType === t.id
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
                {data.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="w-full h-[280px] min-w-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis
                                    dataKey="dateLabel"
                                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval="preserveStartEnd"
                                />
                                {/* Sumbu kiri: IN / OUT (volume per periode) */}
                                <YAxis
                                    yAxisId="left"
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={v => `${(v / 1000).toFixed(1)}k`}
                                    width={40}
                                />
                                {/* Sumbu kanan: Ending Stock (akumulasi, skala lebih besar) */}
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tick={{ fontSize: 10, fill: '#d97706' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={v => `${(v / 1000).toFixed(1)}k`}
                                    width={44}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fffbeb' }} />
                                <Legend
                                    wrapperStyle={{ fontSize: 11, paddingTop: 16 }}
                                    formatter={(value) => (
                                        <span className="text-slate-600 font-semibold">
                                            {value === 'EndingStock' ? 'Ending Stock' : value}
                                        </span>
                                    )}
                                />
                                <ReferenceLine yAxisId="left" y={0} stroke="#e2e8f0" />

                                {/* Bar mode: IN & OUT sebagai batang */}
                                {chartType === 'bar' && (
                                    <>
                                        <Bar yAxisId="left" dataKey="IN" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                                        <Bar yAxisId="left" dataKey="OUT" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
                                    </>
                                )}

                                {/* Line mode: IN & OUT sebagai garis (tanpa dot agar garis bersih) */}
                                {chartType === 'line' && (
                                    <>
                                        <Line
                                            yAxisId="left"
                                            dataKey="IN"
                                            stroke="#10b981"
                                            strokeWidth={2.5}
                                            dot={false}
                                            activeDot={{ r: 6, strokeWidth: 2, stroke: '#ffffff' }}
                                        />
                                        <Line
                                            yAxisId="left"
                                            dataKey="OUT"
                                            stroke="#ef4444"
                                            strokeWidth={2.5}
                                            dot={false}
                                            activeDot={{ r: 6, strokeWidth: 2, stroke: '#ffffff' }}
                                        />
                                    </>
                                )}

                                {/* Ending Stock selalu tampil sebagai garis di sumbu kanan (dengan dot) */}
                                <Line
                                    yAxisId="right"
                                    dataKey="EndingStock"
                                    stroke="#d97706"
                                    strokeWidth={2.5}
                                    dot={{ r: 3, fill: '#d97706' }}
                                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#ffffff' }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* ── Footer note ── */}
            {data.length > 0 && (
                <div className="px-5 pb-4 flex items-center gap-2">
                    <span className="w-2.5 h-0.5 rounded-full bg-amber-500 inline-block" />
                    <span className="text-[10px] text-slate-400 font-medium">
                        Garis kuning = Ending Stock kumulatif (sumbu kanan)
                    </span>
                </div>
            )}
        </div>
    );
}