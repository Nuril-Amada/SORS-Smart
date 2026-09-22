import React, { useState } from 'react';
import {
    Warehouse, ArrowDownToLine, ArrowUpFromLine,
    PackageCheck, TrendingUp, TrendingDown,
    ChevronUp, ChevronDown, Info
} from 'lucide-react';

/* ─────────────────────────────────────────
   Config kartu (statis, tidak berubah)
   Data asli (value, prevValue, unit, description)
   datang dari prop `data`, yang diisi oleh parent
   lewat hasil fetch API / query database.

   Bentuk `data` yang diharapkan:
   {
     beginningStock: { value, prevValue, unit, description },
     totalIn:        { value, prevValue, unit, description },
     totalOut:       { value, prevValue, unit, description },
     endingStock:    { value, prevValue, unit, description },
     netGainLoss:    { value, prevValue, unit, description },
   }
───────────────────────────────────────── */
const CARD_CONFIG = [
    {
        id: 'beginning-stock',
        key: 'beginningStock',
        label: 'Beginning Stock',
        icon: Warehouse,
        accentClass: 'bg-blue-500',
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
        isNetCard: false,
    },
    {
        id: 'volume-in',
        key: 'totalIn',
        label: 'Volume IN',
        icon: ArrowDownToLine,
        accentClass: 'bg-emerald-500',
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        isNetCard: false,
    },
    {
        id: 'volume-out',
        key: 'totalOut',
        label: 'Volume OUT',
        icon: ArrowUpFromLine,
        accentClass: 'bg-orange-500',
        iconBg: 'bg-orange-50',
        iconColor: 'text-orange-600',
        isNetCard: false,
    },
    {
        id: 'ending-stock',
        key: 'endingStock',
        label: 'Ending Stock',
        icon: PackageCheck,
        accentClass: 'bg-indigo-500',
        iconBg: 'bg-indigo-50',
        iconColor: 'text-indigo-600',
        isNetCard: false,
    },
    {
        id: 'net-gain-loss',
        key: 'netGainLoss',
        label: 'Net Gain / Loss',
        icon: null, // ditentukan dinamis (TrendingUp/Down) berdasarkan value
        accentClass: null,
        iconBg: null,
        iconColor: null,
        isNetCard: true,
    },
];

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function formatNum(val) {
    if (val === undefined || val === null) return '-';
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(val);
}

function pctChange(current, prev) {
    if (current == null || prev == null || prev === 0) return null;
    return ((current - prev) / Math.abs(prev)) * 100;
}

/* ─────────────────────────────────────────
   Single KPI Card
   Murni presentational — tidak fetch apa pun,
   hanya menampilkan `item` yang sudah diisi data.
───────────────────────────────────────── */
function KPICard({ id, label, icon: Icon, iconBg, iconColor, accentClass, item, isNetCard }) {
    const [tip, setTip] = useState(false);

    const hasValue = item && item.value !== undefined && item.value !== null;
    const change = hasValue ? pctChange(item.value, item.prevValue) : null;
    const isUp = change !== null && change >= 0;
    const netPositive = hasValue ? item.value >= 0 : true;

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

                    {/* Tooltip trigger — hanya muncul kalau ada description */}
                    {item?.description && (
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
                                    {item.description}
                                    <div className="absolute -top-1.5 right-2 w-3 h-3 bg-slate-800 rotate-45 border-l border-t border-slate-700" />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Label */}
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    {label}
                </p>

                {/* Value — tampil "-" kalau data belum ada */}
                {!hasValue ? (
                    <p className="text-2xl font-black text-slate-300 tracking-tight">-</p>
                ) : isNetCard ? (
                    <p className={`text-2xl font-black tracking-tight ${netPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {netPositive ? '+' : ''}{formatNum(item.value)}
                    </p>
                ) : (
                    <p className="text-2xl font-black text-slate-800 tracking-tight">
                        {formatNum(item.value)}
                    </p>
                )}

                {/* Unit */}
                {item?.unit && (
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{item.unit}</p>
                )}

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
   Presentational only — data datang dari prop `data`.
   Parent yang bertanggung jawab fetch ke API/database,
   contoh:

     const [data, setData] = useState({});
     useEffect(() => {
       fetch('/api/kpi?...').then(r => r.json()).then(setData);
     }, [filters]);
     ...
     <KPICards data={data} />
───────────────────────────────────────── */
export default function KPICards({ data = {} }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {CARD_CONFIG.map((cfg) => {
                const item = data[cfg.key];
                const net = item?.value >= 0;

                const Icon = cfg.isNetCard ? (net ? TrendingUp : TrendingDown) : cfg.icon;
                const accentClass = cfg.isNetCard ? (net ? 'bg-emerald-500' : 'bg-red-500') : cfg.accentClass;
                const iconBg = cfg.isNetCard ? (net ? 'bg-emerald-50' : 'bg-red-50') : cfg.iconBg;
                const iconColor = cfg.isNetCard ? (net ? 'text-emerald-600' : 'text-red-600') : cfg.iconColor;

                return (
                    <KPICard
                        key={cfg.id}
                        id={cfg.id}
                        label={cfg.label}
                        icon={Icon}
                        iconBg={iconBg}
                        iconColor={iconColor}
                        accentClass={accentClass}
                        item={item}
                        isNetCard={cfg.isNetCard}
                    />
                );
            })}
        </div>
    );
}