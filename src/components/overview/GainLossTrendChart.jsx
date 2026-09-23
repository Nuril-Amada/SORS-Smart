import React, { useState } from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { ArrowUpDown, Inbox } from 'lucide-react';

/* ─────────────────────────────────────────
   Presentational only — TIDAK ada data dummy
   dan TIDAK fetch apa pun di sini.

   `data` datang dari parent (hasil fetch API / DB),
   bentuknya array harian, contoh:

   [
     { date: '2026-09-01', GainLoss: 12.5,  CumulativeGainLoss: 12.5 },
     { date: '2026-09-02', GainLoss: -8.2,  CumulativeGainLoss: 4.3  },
     ...
   ]

   `GainLoss`           : selisih bersih hari itu (KG). Positif = gain,
                           negatif = loss. Dipakai sebagai bar/line utama.
   `CumulativeGainLoss` : akumulasi berjalan dari awal periode s/d hari itu
                           (opsional). Kalau tidak dikirim dari backend,
                           dihitung otomatis di komponen ini dari `GainLoss`.

   `date` harus string yang bisa di-parse Date (format ISO
   "YYYY-MM-DD" paling aman), atau boleh juga langsung
   kirim field `dateLabel` siap-tampil dari backend.

   Contoh pemakaian di parent:

     const [gainLossData, setGainLossData] = useState([]);
     useEffect(() => {
       fetch(`/api/gain-loss-harian?...`)
         .then(r => r.json())
         .then(setGainLossData);
     }, [filters]);
     ...
     <GainLossTrendChart data={gainLossData} />
───────────────────────────────────────── */

const GAIN_COLOR = '#10b981';  // emerald — hari gain (positif)
const LOSS_COLOR = '#ef4444';  // rose — hari loss (negatif)
const CUMULATIVE_COLOR = '#d97706'; // amber — garis akumulasi

/* ─────────────────────────────────────────
   Custom Tooltip — tema putih agak cream (senada DailyTrendChart)
───────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;

    return (
        <div className="bg-[#fefcf8]/95 border border-amber-200/60 rounded-xl p-3.5 shadow-xl min-w-[190px] backdrop-blur-sm">
            <p className="text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-2.5">
                {label}
            </p>
            {payload.map(p => {
                const isGainLossBar = p.dataKey === 'GainLoss';
                const color = isGainLossBar
                    ? (p.value >= 0 ? GAIN_COLOR : LOSS_COLOR)
                    : (p.color || CUMULATIVE_COLOR);
                const displayLabel = p.dataKey === 'CumulativeGainLoss' ? 'Akumulasi' : (isGainLossBar ? (p.value >= 0 ? 'Gain' : 'Loss') : p.dataKey);

                return (
                    <div key={p.dataKey} className="flex items-center justify-between gap-6 mb-1 last:mb-0">
                        <span className="text-stone-600 text-xs flex items-center gap-1.5 font-medium">
                            <span
                                className="w-2.5 h-2.5 rounded-full inline-block"
                                style={{ background: color }}
                            />
                            {displayLabel}
                        </span>
                        <span className="text-stone-900 text-xs font-bold">
                            {p.value >= 0 ? '+' : ''}{p.value.toLocaleString('id-ID')} KG
                        </span>
                    </div>
                );
            })}
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

   - 'hari'  : dipakai apa adanya (cuma nambah dateLabel & hitung
               CumulativeGainLoss berjalan kalau belum dikirim backend)
   - 'bulan' : GainLoss dijumlah per bulan
   - 'tahun' : GainLoss dijumlah per tahun

   Untuk 'bulan'/'tahun', CumulativeGainLoss dihitung ULANG dari total
   per-bucket (bukan dipakai apa adanya dari data harian), supaya tetap
   akurat sebagai akumulasi berjalan di level Bulan/Tahun.
───────────────────────────────────────── */
function aggregateData(data, period) {
    if (period === 'hari') {
        let running = 0;
        return data.map(d => {
            running += d.GainLoss ?? 0;
            return {
                ...d,
                dateLabel: d.dateLabel ?? formatDateLabel(d.date),
                CumulativeGainLoss: d.CumulativeGainLoss ?? running,
            };
        });
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
            buckets.set(key, { dateLabel: label, GainLoss: 0, _sortKey: key });
        }
        buckets.get(key).GainLoss += d.GainLoss ?? 0;
    });

    const sorted = Array.from(buckets.values()).sort((a, b) => a._sortKey.localeCompare(b._sortKey));

    // Hitung ulang akumulasi berjalan di level Bulan/Tahun
    let running = 0;
    return sorted.map(b => {
        running += b.GainLoss;
        return { ...b, CumulativeGainLoss: running };
    });
}

/* ─────────────────────────────────────────
   Chart Type Toggle — GainLoss bisa Bar atau Line,
   Akumulasi selalu tampil sebagai garis (sumbu kanan)
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
            <p className="text-sm font-semibold">Belum ada data gain/loss harian</p>
        </div>
    );
}

/* ─────────────────────────────────────────
   GainLossTrendChart component
───────────────────────────────────────── */
export default function GainLossTrendChart({ data = [] }) {
    const [chartType, setChartType] = useState('bar');
    const [filterPeriod, setFilterPeriod] = useState('hari');

    const chartData = aggregateData(data, filterPeriod);

    const totalGain = data.reduce((s, d) => s + Math.max(d.GainLoss ?? 0, 0), 0);
    const totalLoss = data.reduce((s, d) => s + Math.min(d.GainLoss ?? 0, 0), 0); // tetap negatif
    const netGainLoss = totalGain + totalLoss;
    const lastCumulative = chartData.length ? chartData[chartData.length - 1].CumulativeGainLoss : null;

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* ── Header ── */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                        <ArrowUpDown className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Tren Gain/Loss</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Selisih ukur (gain/loss)
                        </p>
                    </div>
                </div>

                {/* Summary badges — hanya masuk akal kalau ada datanya */}
                <div className="flex items-center gap-2 flex-wrap">
                    {data.length > 0 && (
                        <>
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
                                Gain {totalGain.toLocaleString('id-ID')} KG
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-600">
                                Loss {totalLoss.toLocaleString('id-ID')} KG
                            </span>
                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${netGainLoss >= 0
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-red-50 border-red-200 text-red-600'
                                }`}>
                                Net {netGainLoss >= 0 ? '+' : ''}{netGainLoss.toLocaleString('id-ID')} KG
                            </span>
                            {lastCumulative !== null && (
                                <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-700">
                                    Akumulasi {lastCumulative >= 0 ? '+' : ''}{lastCumulative.toLocaleString('id-ID')} KG
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

                    {/* Chart type selector — SELALU tampil, walau data masih kosong */}
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
                    <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis
                                dataKey="dateLabel"
                                tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                                interval="preserveStartEnd"
                            />
                            {/* Sumbu kiri: GainLoss harian (bisa positif/negatif) */}
                            <YAxis
                                yAxisId="left"
                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={v => `${v}`}
                                width={40}
                            />
                            {/* Sumbu kanan: Akumulasi Gain/Loss */}
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tick={{ fontSize: 10, fill: '#d97706' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={v => `${v}`}
                                width={44}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fffbeb' }} />
                            <Legend
                                wrapperStyle={{ fontSize: 11, paddingTop: 16 }}
                                formatter={(value) => (
                                    <span className="text-slate-600 font-semibold">
                                        {value === 'CumulativeGainLoss' ? 'Akumulasi' : value === 'GainLoss' ? 'Gain/Loss Harian' : value}
                                    </span>
                                )}
                            />
                            <ReferenceLine yAxisId="left" y={0} stroke="#cbd5e1" />

                            {/* Bar mode: GainLoss harian, warna per-bar (hijau=gain, merah=loss) */}
                            {chartType === 'bar' && (
                                <Bar yAxisId="left" dataKey="GainLoss" radius={[4, 4, 4, 4]} maxBarSize={28}>
                                    {chartData.map((entry, idx) => (
                                        <Cell
                                            key={`cell-${idx}`}
                                            fill={(entry.GainLoss ?? 0) >= 0 ? GAIN_COLOR : LOSS_COLOR}
                                        />
                                    ))}
                                </Bar>
                            )}

                            {/* Line mode: GainLoss harian sebagai garis tunggal */}
                            {chartType === 'line' && (
                                <Line
                                    yAxisId="left"
                                    dataKey="GainLoss"
                                    stroke="#0ea5e9"
                                    strokeWidth={2.5}
                                    dot={{ r: 4, fill: '#0ea5e9' }}
                                    activeDot={{ r: 6 }}
                                />
                            )}

                            {/* Akumulasi selalu tampil sebagai garis di sumbu kanan */}
                            <Line
                                yAxisId="right"
                                dataKey="CumulativeGainLoss"
                                stroke={CUMULATIVE_COLOR}
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: CUMULATIVE_COLOR }}
                                activeDot={{ r: 6 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* ── Footer note ── */}
            {data.length > 0 && (
                <div className="px-5 pb-4 flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        <span className="text-[10px] text-slate-400 font-medium">Gain (hijau)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                        <span className="text-[10px] text-slate-400 font-medium">Loss (merah)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-0.5 rounded-full bg-amber-500 inline-block" />
                        <span className="text-[10px] text-slate-400 font-medium">Garis kuning = Akumulasi (sumbu kanan)</span>
                    </span>
                </div>
            )}
        </div>
    );
}