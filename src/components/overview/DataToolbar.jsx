import React, { useRef, useState } from 'react';
import { FileText, Upload, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DataToolbar({ filters, onResetFilters, onExportPDF, onImportFile }) {
    const fileInputRef = useRef(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 4000);
    };

    /* ── Import: Langsung buka file explorer/dokumen tanpa modal ── */
    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset agar bisa pilih file yang sama jika diinginkan
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validasi ekstensi dokumen
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

    /* ── Export: Backend yang mengatur, frontend menyediakan button ── */
    const handleExportPDF = () => {
        if (onExportPDF) {
            onExportPDF(filters);
        } else {
            showToast('Permintaan cetak PDF dikirim ke backend server...');
        }
    };

    return (
        <div className="relative">
            {/* Hidden native file input for direct document picking */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
                onChange={handleFileChange}
            />

            <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Toast Notification (jika file dipilih / aksi export) */}
                <div className="flex-1 min-w-[200px]">
                    {toast && (
                        <div
                            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium animate-fade-in ${toast.type === 'error'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                        >
                            {toast.type === 'error' ? (
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                            )}
                            <span>{toast.message}</span>
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 flex-wrap ml-auto">

                    {/* Export PDF Button — Backend yang mengatur */}
                    <button
                        id="export-pdf-btn"
                        type="button"
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow-amber-200 hover:shadow-md active:scale-95 cursor-pointer"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Export Data</span>
                    </button>

                    {/* Import Data — Langsung pilih dokumen */}
                    <button
                        id="import-data-btn"
                        type="button"
                        onClick={handleImportClick}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
                    >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Import Data</span>
                    </button>

                    {/* Reset Filter */}
                    <button
                        id="reset-filter-btn"
                        type="button"
                        onClick={onResetFilters}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-600 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Filter</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
