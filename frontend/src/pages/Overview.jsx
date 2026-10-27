import React, { useState, useEffect } from 'react';
import FilterBar from '../components/overview/FilterBar';
import KPICards from '../components/overview/KPICards';
import DailyTrendChart from '../components/overview/DailyTrendChart';
import GainLossTrendChart from '../components/overview/GainLossTrendChart';
import StockDistributionChart from '../components/overview/StockDistributionChart';
import TransactionByUnitChart from '../components/overview/TransactionByUnitChart';
import { OilTransactionDetail } from '../components/overview/OilTransactions';
import {
    fetchKpi,
    fetchDailyTrend,
    fetchGainLossTrend,
    fetchStockDistribution,
    fetchTransactionByUnit,
    fetchTransactions,
    deleteTransactions,
    uploadImportFile,
    getExportCsvUrl,
    fetchProductNames
} from '../services/api';

function buildInitialFilters() {
    return {
        dateFrom: '',
        dateTo: '',
        product: '',
        cluster: '',
    };
}

function buildEmptyFilters() {
    return {
        dateFrom: '',
        dateTo: '',
        product: '',
        cluster: '',
    };
}

// Memory cache untuk mempertahankan data & filter saat perpindahan tab / route
let overviewCache = {
    dailyTrend: [],
    gainLoss: [],
    kpi: {},
    stockDist: { product: [], cluster: [], tank: [] },
    transByUnit: { unit: [], cluster: [], tank: [] },
    transactions: [],
    filters: buildInitialFilters(),
};

export default function Overview({ onNavigate }) {
    const [filters, setFilters] = useState(overviewCache.filters || buildInitialFilters());
    const [productNames, setProductNames] = useState([]);

    const [dailyTrendData, setDailyTrendData] = useState(overviewCache.dailyTrend);
    const [gainLossData, setGainLossData] = useState(overviewCache.gainLoss);
    const [kpiData, setKpiData] = useState(overviewCache.kpi);
    const [stockDistData, setStockDistData] = useState(overviewCache.stockDist);
    const [transByUnitData, setTransByUnitData] = useState(overviewCache.transByUnit);
    const [oilTransactions, setOilTransactions] = useState(overviewCache.transactions);

    // Fetch product names once on mount
    useEffect(() => {
        fetchProductNames().then((names) => {
            if (names && names.length > 0) setProductNames(names);
        });
    }, []);

    const handleResetFilters = () => {
        const empty = buildEmptyFilters();
        overviewCache.filters = empty;
        setFilters(empty);
    };

    const loadAllData = (currentFilters) => {
        fetchDailyTrend(currentFilters).then((res) => {
            overviewCache.dailyTrend = res || [];
            setDailyTrendData(res || []);
        });
        fetchGainLossTrend(currentFilters).then((res) => {
            overviewCache.gainLoss = res || [];
            setGainLossData(res || []);
        });
        fetchKpi(currentFilters).then((res) => {
            overviewCache.kpi = res || {};
            setKpiData(res || {});
        });
        fetchStockDistribution(currentFilters).then((res) => {
            const data = res || { product: [], cluster: [], tank: [] };
            overviewCache.stockDist = data;
            setStockDistData(data);
        });
        fetchTransactionByUnit(currentFilters).then((res) => {
            const data = res || { unit: [], cluster: [], tank: [] };
            overviewCache.transByUnit = data;
            setTransByUnitData(data);
        });
        fetchTransactions(currentFilters, 1, 0).then((res) => {
            overviewCache.transactions = res || [];
            setOilTransactions(res || []);
        });
    };

    useEffect(() => {
        overviewCache.filters = filters;
        loadAllData(filters);
    }, [filters]);

    const handleExportPDF = async (currFilters) => {
        const url = getExportCsvUrl(currFilters);
        window.open(url, '_blank');
        return 'Data berhasil diexport ke CSV.';
    };

    const handleImportFile = async (file) => {
        const msg = await uploadImportFile(file);
        loadAllData(filters);
        return msg;
    };

    const handleDeleteData = async (currFilters) => {
        const msg = await deleteTransactions(currFilters);
        loadAllData(filters);
        return msg;
    };

    const handleViewAllTransactions = (activeTableFilters) => {
        if (onNavigate) {
            onNavigate('/detail-transaksi', activeTableFilters);
        } else {
            window.history.pushState({ filters: activeTableFilters }, '', '/detail-transaksi');
            window.dispatchEvent(new PopStateEvent('popstate'));
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 pt-16">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

                {/* ── Section 1: Filter Container & Action Buttons (Terintegrasi) ── */}
                <FilterBar
                    filters={filters}
                    onFiltersChange={setFilters}
                    onResetFilters={handleResetFilters}
                    onExportPDF={handleExportPDF}
                    onImportFile={handleImportFile}
                    onDeleteData={handleDeleteData}
                    productOptions={productNames.map(p => ({ value: p, label: p }))}
                />

                {/* ── Section 3: KPI Cards ───────────────── */}
                <KPICards data={kpiData} />

                {/* ══════════════════════════════════════════
                    Section 4: Visualisasi / Charts
                ══════════════════════════════════════════ */}
                <div>
                    <div className="space-y-5">
                        {/* A — Tren Transaksi Harian + Tren Gain/Loss Harian (bersampingan) */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                            <DailyTrendChart data={dailyTrendData} />
                            <GainLossTrendChart data={gainLossData} />
                        </div>

                        {/* B + C — Side by side (responsive) */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                            <StockDistributionChart data={stockDistData} filters={filters} />
                            <TransactionByUnitChart data={transByUnitData} filters={filters} />
                        </div>

                        {/* D — Detail Transaksi Minyak (Tabel Detail 5 Teratas & Lihat Selengkapnya) */}
                        <OilTransactionDetail
                            filters={filters}
                            onFiltersChange={setFilters}
                            transactions={oilTransactions}
                            onViewAll={handleViewAllTransactions}
                            productNames={productNames}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}