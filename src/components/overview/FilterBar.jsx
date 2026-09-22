import React, { useRef, useState } from 'react';
import {
    Calendar, ChevronDown, Package, Layers,
    FileText, Upload, RotateCcw, Trash2,
    CheckCircle2, AlertCircle
} from 'lucide-react';

function fmt(d) {
    return d.toISOString().split('T')[0];
}

function formatDateDisplay(dateStr) {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

export function getDefaultDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return { dateFrom: fmt(firstDay), dateTo: fmt(today) };
}

/* ─────────────────────────────────────────────────────────────
   FilterBar Component
   - Action buttons berada di POJOK KANAN ATAS
   - Tombol Hapus Data di sebelah kanan Reset Filter
   - Modal konfirmasi hapus data periode dengan gaya konsisten Master Data
   - Tulisan periode di pojok kiri atas telah dihapus
───────────────────────────────────────────────────────────── */
export default function FilterBar({
    filters,
    onFiltersChange,
    onResetFilters,
    onExportPDF,
    onImportFile,
    onDeleteData,
    productOptions = [],
    clusterOptions = []
}) {
    const { dateFrom, dateTo, product, cluster } = filters;
    const fileInputRef = useRef(null);
    const [toast, setToast] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Variabel untuk modal konfirmasi
    const tanggalAwal = dateFrom;
    const tanggalAkhir = dateTo;
    const isPeriodSelected = Boolean(dateFrom && dateTo);
    const source = cluster;

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 4000);
    };

    const handleDateFrom = (e) => {
        onFiltersChange({ ...filters, dateFrom: e.target.value });
    };

    const handleDateTo = (e) => {
        onFiltersChange({ ...filters, dateTo: e.target.value });
    };

    /* ── Import Dokumen langsung via File Explorer ── */
    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validExtensions = ['.csv', '.xlsx', '.xls'];
        const isExtValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

        if (!isExtValid) {
            showToast(`File "${file.name}" tidak valid. Harap pilih dokumen CSV atau Excel.`, 'error');
            return;
        }

        if (onImportFile) {
            onImportFile(file);
        }

        showToast(`Dokumen "${file.name}" (${(file.size / 1024).toFixed(1)} KB) berhasil dipilih.`);
    };

    /* ── Export PDF — Trigger button untuk backend ── */
    const handleExportPDF = () => {
        if (onExportPDF) {
            onExportPDF(filters);
        } else {
            showToast('Permintaan cetak PDF dikirim ke backend server...');
        }
    };

    /* ── Eksekusi Hapus Data Periode ── */
    const handleConfirmDelete = () => {
        setShowDeleteModal(false);
        if (onDeleteData) {
            onDeleteData(filters);
        }
        showToast(`Data transaksi periode ${formatDateDisplay(dateFrom)} s/d ${formatDateDisplay(dateTo)} berhasil dihapus.`, 'success');
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5">
            {/* Hidden native file input untuk import dokumen */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* ═══════════════════════════════════════════════════════
                BARIS ATAS: Action Buttons di Pojok Kanan Atas
            ═══════════════════════════════════════════════════════ */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100">
                {/* Area Kiri: Hanya menampilkan Toast Feedback jika aktif (tulisan periode dihapus) */}
                <div className="flex-1 min-w-[200px]">
                    {toast && (
                        <div
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium animate-in fade-in duration-200 ${
                                toast.type === 'error'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                        >
                            {toast.type === 'error' ? (
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>{toast.message}</span>
                        </div>
                    )}
                </div>

                {/* Tombol Aksi di Pojok Kanan Atas */}
                <div className="flex items-center gap-2.5 flex-wrap justify-end">
                    {/* 1. Export PDF */}
                    <button
                        id="export-pdf-btn"
                        type="button"
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow-amber-200 hover:shadow-md active:scale-95 cursor-pointer"
                        title="Export data laporan ke PDF"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Export PDF</span>
                    </button>

                    {/* 2. Import Data */}
                    <button
                        id="import-data-btn"
                        type="button"
                        onClick={handleImportClick}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
                        title="Import file dokumen (CSV / Excel)"
                    >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Import Data</span>
                    </button>

                    {/* 3. Reset Filter */}
                    <button
                        id="reset-filter-btn"
                        type="button"
                        onClick={onResetFilters}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-600 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                        title="Kembalikan filter ke kondisi awal"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Filter</span>
                    </button>

                    {/* 4. Trash / Hapus Data Periode (di sebelah kanan Reset Filter) */}
                    <button
                        id="delete-data-btn"
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 hover:border-rose-300 text-rose-600 hover:text-rose-700 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                        title="Hapus data transaksi pada periode tanggal terpilih"
                    >
                        <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                        <span>Hapus Data</span>
                    </button>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                BARIS BAWAH: Input Filter (Tanggal, Produk, Cluster)
            ═══════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pt-4">

                {/* Filter 1: Periode Tanggal */}
                <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        Periode Tanggal
                    </label>
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <input
                                id="filter-date-from"
                                type="date"
                                value={dateFrom}
                                onChange={handleDateFrom}
                                max={dateTo}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all bg-slate-50/60 cursor-pointer"
                            />
                        </div>
                        <span className="text-slate-300 text-sm font-light">→</span>
                        <div className="flex-1">
                            <input
                                id="filter-date-to"
                                type="date"
                                value={dateTo}
                                onChange={handleDateTo}
                                min={dateFrom}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all bg-slate-50/60 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Filter 2: Jenis Produk Minyak (Template Data Backend) */}
                <div>
                    <label
                        htmlFor="filter-product"
                        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5"
                    >
                        <Package className="w-3.5 h-3.5 text-amber-500" />
                        Jenis Produk Minyak
                    </label>
                    <div className="relative">
                        <select
                            id="filter-product"
                            value={product || ''}
                            onChange={e => onFiltersChange({ ...filters, product: e.target.value })}
                            className="w-full appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all bg-slate-50/60 cursor-pointer"
                        >
                            <option value="">Semua Jenis Produk</option>
                            {productOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Filter 3: Cluster Tank Farm (Template Data Backend) */}
                <div>
                    <label
                        htmlFor="filter-cluster"
                        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5"
                    >
                        <Layers className="w-3.5 h-3.5 text-amber-500" />
                        Cluster Tank Farm
                    </label>
                    <div className="relative">
                        <select
                            id="filter-cluster"
                            value={cluster || ''}
                            onChange={e => onFiltersChange({ ...filters, cluster: e.target.value })}
                            className="w-full appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all bg-slate-50/60 cursor-pointer"
                        >
                            <option value="">Semua Cluster Tangki</option>
                            {clusterOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                </div>

            </div>

            {/* ═══════════════════════════════════════════════════════
                MODAL KONFIRMASI HAPUS DATA PERIODE (Gaya Master Data)
            ═══════════════════════════════════════════════════════ */}
            {showDeleteModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 50,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(0,0,0,0.45)",
                        backdropFilter: "blur(4px)",
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowDeleteModal(false);
                    }}
                >
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: "20px",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                            width: "100%",
                            maxWidth: "380px",
                            animation: "slideDown 0.25s ease",
                        }}
                    >
                        <div style={{ padding: "20px 20px 15px" }}>
                            <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 700, color: "#1e1b4b" }}>
                                {isPeriodSelected ? "Hapus Data Periode" : "Peringatan Filter Tanggal"}
                            </h3>

                            {isPeriodSelected ? (
                                <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", lineHeight: "1.5" }}>
                                    Apakah Anda yakin ingin menghapus data dari periode{" "}
                                    <span style={{ fontWeight: 700, color: "#dc2626" }}>
                                        {formatDateDisplay(tanggalAwal)}
                                    </span>{" "}
                                    hingga{" "}
                                    <span style={{ fontWeight: 700, color: "#dc2626" }}>
                                        {formatDateDisplay(tanggalAkhir)}
                                    </span>
                                    {source && (
                                        <>
                                            {" "}pada lokasi{" "}
                                            <span style={{ fontWeight: 600, color: "#374151", textTransform: "capitalize" }}>
                                                {source}
                                            </span>
                                        </>
                                    )}
                                    ?
                                </p>
                            ) : (
                                <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", lineHeight: "1.5" }}>
                                    Silakan tentukan <strong style={{ color: "#374151" }}>Dari Tanggal</strong> dan{" "}
                                    <strong style={{ color: "#374151" }}>Sampai Tanggal</strong> terlebih dahulu untuk memilih periode data yang akan dihapus.
                                </p>
                            )}
                        </div>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "10px",
                                padding: "16px 24px 24px",
                                borderTop: "1px solid #f1f5f9",
                            }}
                        >
                            {isPeriodSelected ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(false)}
                                        style={{
                                            border: "1.5px solid #e5e7eb",
                                            borderRadius: "10px",
                                            padding: "8px 20px",
                                            fontSize: "13px",
                                            color: "#6b7280",
                                            background: "#fff",
                                            cursor: "pointer",
                                            fontWeight: 500,
                                        }}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmDelete}
                                        style={{
                                            background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                            border: "none",
                                            borderRadius: "10px",
                                            padding: "8px 20px",
                                            fontSize: "13px",
                                            color: "#fff",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Ya, Hapus
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    style={{
                                        background: "linear-gradient(135deg, #363D48)",
                                        border: "none",
                                        borderRadius: "10px",
                                        padding: "8px 20px",
                                        fontSize: "13px",
                                        color: "#fff",
                                        cursor: "pointer",
                                        fontWeight: 600,
                                    }}
                                >
                                    Mengerti
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
