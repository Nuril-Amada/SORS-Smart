import React, { useState } from 'react';
import {
    Warehouse, ArrowDownToLine, ArrowUpFromLine,
    PackageCheck, TrendingUp, TrendingDown,
    ChevronUp, ChevronDown, Info
} from 'lucide-react';

/* ─────────────────────────────────────────
   Mock KPI data
   In production: replace with API call filtered by { dateFrom, dateTo, product, cluster }
───────────────────────────────────────── */
const MOCK_KPI = {
    beginningStock: {
        value: 45230.50,
        prevValue: 41820.30,
        unit: 'MT',
        description: 'Stok awal pada awal periode laporan yang dipilih, dihitung berdasarkan saldo akhir periode sebelumnya.',
    },
    totalIn: {
        value: 12450.75,
        prevValue: 10980.50,
        unit: 'MT',
        description: 'Total volume minyak yang masuk ke seluruh tangki (penerimaan) selama periode yang dipilih.',
    },
    totalOut: {
        value: 8320.25,
        prevValue: 9150.75,
        unit: 'MT',
        description: 'Total volume minyak yang keluar dari seluruh tangki (pengiriman/penjualan) selama periode yang dipilih.',
    },
    endingStock: {
        value: 49361.00,
        prevValue: 43650.05,
        unit: 'MT',
        description: 'Stok akhir pada akhir periode laporan: Beginning Stock + IN − OUT.',
    },
    netGainLoss: {
        value: 4130.50,
        prevValue: -170.25,
        unit: 'MT',
        description: 'Selisih total IN dikurangi total OUT. Nilai positif = surplus (gain), nilai negatif = defisit (loss).',
    },
};

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function formatNum(val) {
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(val);
}

function pctChange(current, prev) {
    if (prev == null || prev === 0) return null;
    return ((current - prev) / Math.abs(prev)) * 100;
}

/* ─────────────────────────────────────────
   Single KPI Card
───────────────────────────────────────── */
function KPICard({ id, label, icon: Icon, data, accentClass, iconBg, iconColor, isNetCard }) {
    const [tip, setTip] = useState(false);
    const change = pctChange(data.value, data.prevValue);
    const isUp = change !== null && change >= 0;
    const netPositive = data.value >= 0;

    return (
        <div
            id={`kpi-${id}`}
            className="relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
        >
            {/* Accent top border */}
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${accentClass}`} />

            <div className="p-5">
                {/* Row: icon + tooltip */}
                <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>

                    {/* Tooltip trigger */}
                    <div className="relative">
                        <button
                            onMouseEnter={() => setTip(true)}
                            onMouseLeave={() => setTip(false)}
                            className="text-slate-200 hover:text-slate-400 transition-colors mt-0.5"
                            aria-label="Info"
                        >
                            <Info className="w-3.5 h-3.5" />
                        </button>
                        {tip && (
                            <div className="absolute right-0 top-6 w-56 bg-slate-800 text-white text-[10px] rounded-xl p-3 shadow-2xl z-20 leading-relaxed border border-slate-700">
                                {data.description}
                                <div className="absolute -top-1.5 right-2 w-3 h-3 bg-slate-800 rotate-45 border-l border-t border-slate-700" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Label */}
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    {label}
                </p>

                {/* Value */}
                {isNetCard ? (
                    <p className={`text-2xl font-black tracking-tight ${netPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {netPositive ? '+' : ''}{formatNum(data.value)}
                    </p>
                ) : (
                    <p className="text-2xl font-black text-slate-800 tracking-tight">
                        {formatNum(data.value)}
                    </p>
                )}

                {/* Unit */}
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{data.unit}</p>

                {/* Trend vs previous period */}
                {change !== null && (
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-50">
                        <div className={`flex items-center gap-0.5 text-[11px] font-bold ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                            {isUp
                                ? <ChevronUp className="w-3.5 h-3.5" />
                                : <ChevronDown className="w-3.5 h-3.5" />}
                            {Math.abs(change).toFixed(1)}%
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">vs periode lalu</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   KPI Cards Section
───────────────────────────────────────── */
export default function KPICards({ filters }) {
    // In production: use filters to fetch data from API
    const kpi = MOCK_KPI;

    const net = kpi.netGainLoss.value >= 0;

    const cards = [
        {
            id: 'beginning-stock',
            label: 'Beginning Stock',
            icon: Warehouse,
            data: kpi.beginningStock,
            accentClass: 'bg-blue-500',
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            isNetCard: false,
        },
        {
            id: 'volume-in',
            label: 'Volume IN',
            icon: ArrowDownToLine,
            data: kpi.totalIn,
            accentClass: 'bg-emerald-500',
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            isNetCard: false,
        },
        {
            id: 'volume-out',
            label: 'Volume OUT',
            icon: ArrowUpFromLine,
            data: kpi.totalOut,
            accentClass: 'bg-orange-500',
            iconBg: 'bg-orange-50',
            iconColor: 'text-orange-600',
            isNetCard: false,
        },
        {
            id: 'ending-stock',
            label: 'Ending Stock',
            icon: PackageCheck,
            data: kpi.endingStock,
            accentClass: 'bg-indigo-500',
            iconBg: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
            isNetCard: false,
        },
        {
            id: 'net-gain-loss',
            label: 'Net Gain / Loss',
            icon: net ? TrendingUp : TrendingDown,
            data: kpi.netGainLoss,
            accentClass: net ? 'bg-emerald-500' : 'bg-red-500',
            iconBg: net ? 'bg-emerald-50' : 'bg-red-50',
            iconColor: net ? 'text-emerald-600' : 'text-red-600',
            isNetCard: true,
        },
    ];

    return (
        <div>
            {/* Section heading */}
            <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-4 rounded-full bg-amber-500" />
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                    Key Performance Indicators
                </h3>
            </div>

            {/* Responsive 5-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {cards.map(card => (
                    <KPICard key={card.id} {...card} />
                ))}
            </div>

            {/* Note */}
            <p className="text-[10px] text-slate-400 mt-3 font-medium">
                * Data di atas merupakan simulasi. Nilai aktual akan ditampilkan setelah terhubung ke database operasional.
                Hover ikon ℹ pada setiap kartu untuk keterangan detail.
            </p>
        </div>
    );
}
