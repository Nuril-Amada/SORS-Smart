import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BarChart2, Inbox } from 'lucide-react';

/* ─────────────────────────────────────────
   Grouping tabs
───────────────────────────────────────── */
const TABS = [
    { id: 'unit', label: 'Unit Kerja' },
    { id: 'cluster', label: 'Cluster Tank' },
    { id: 'tank', label: 'Tangki' },
];

/* ─────────────────────────────────────────
   Presentational only — TIDAK ada data dummy
   dan TIDAK fetch apa pun di sini.

   `data` datang dari parent (hasil fetch API / DB),
   bisa berbentuk array:
   [
     { name: 'Produksi', IN: 8420, OUT: 6310, count: 128 },
     { name: 'Gudang',   IN: 5830, OUT: 4920, count:  97 },
     ...
   ]

   Atau object terkelompok:
   {
     unit:    [{ name: 'Produksi', IN: 8420, OUT: 6310, count: 128 }, ...],
     cluster: [{ name: 'Cluster A', IN: 5820, OUT: 4310, count: 98 }, ...],
     tank:    [{ name: 'Tki-01', IN: 1200, OUT: 900, count: 25 }, ...]
   }

   Contoh pemakaian di parent:
     const [data, setData] = useState([]);
     useEffect(() => {
       fetch(`/api/transaction-by-unit?...`).then(r => r.json()).then(setData);
     }, [filters]);
     ...
     <TransactionByUnitChart data={data} />
───────────────────────────────────────── */

/* ─────────────────────────────────────────
   Custom Tooltip — tema putih agak cream
───────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const inVal = payload.find(p => p.dataKey === 'IN')?.value ?? 0;
    const outVal = payload.find(p => p.dataKey === 'OUT')?.value ?? 0;
    const countVal = payload[0]?.payload?.count;
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
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                        Volume OUT
                    </span>
                    <span className="text-xs font-bold text-stone-900">
                        {Number(outVal).toLocaleString('id-ID')} KG
                    </span>
                </div>
                {countVal !== undefined && (
                    <div className="flex items-center justify-between gap-6">
                        <span className="text-xs text-stone-600 flex items-center gap-1.5 font-medium">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />
                            Jml. Transaksi
                        </span>
                        <span className="text-xs font-bold text-stone-900">
                            {Number(countVal).toLocaleString('id-ID')} trx
                        </span>
                    </div>
                )}
            </div>
            <div className="mt-2.5 pt-2 border-t border-amber-100 flex items-center justify-between">
                <span className="text-xs text-stone-500 font-medium">Selisih</span>
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
        { label: 'Total IN', value: `${totalIN.toLocaleString('id-ID')} KG`, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        { label: 'Total OUT', value: `${totalOUT.toLocaleString('id-ID')} KG`, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
        ...(totalCount > 0 ? [{ label: 'Transaksi', value: `${totalCount.toLocaleString('id-ID')} trx`, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' }] : []),
        {
            label: 'Net Selisih',
            value: `${selisih >= 0 ? '+' : ''}${selisih.toLocaleString('id-ID')} KG`,
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
                    <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                        <BarChart2 className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Transaksi per {TABS.find(t => t.id === activeTab)?.label}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Volume IN &amp; OUT · Satuan: KG
                        </p>
                    </div>
                </div>

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

            {/* ── Content ── */}
            <div className="px-5 pt-5 pb-2">
                {chartData.length === 0 ? (
                    <EmptyState />
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart
                                data={chartData}
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
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fffbeb' }} />
                                <Legend
                                    wrapperStyle={{ fontSize: 11, paddingTop: 14 }}
                                    formatter={(value) => (
                                        <span className="text-slate-600 font-semibold">Volume {value}</span>
                                    )}
                                />
                                <Bar dataKey="IN" fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="OUT" fill="#f97316" radius={[5, 5, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>

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
