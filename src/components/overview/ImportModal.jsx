import React, { useState, useRef, useCallback } from 'react';
import {
    X, Upload, FileText, AlertCircle, CheckCircle2,
    ChevronDown, ChevronUp, Loader2, FileSpreadsheet,
    FileX, Info, ClipboardList
} from 'lucide-react';

/* ─────────────────────────────────────────
   Configuration
───────────────────────────────────────── */
const REQUIRED_COLUMNS = [
    'tanggal',
    'jenis_produk',
    'cluster_tank',
    'volume',
    'jenis_transaksi',
];

const COLUMN_DISPLAY = {
    tanggal:          'Tanggal',
    jenis_produk:     'Jenis Produk',
    cluster_tank:     'Cluster Tank',
    volume:           'Volume (MT)',
    jenis_transaksi:  'Jenis Transaksi',
};

const VALID_TRANSACTION_TYPES = ['IN', 'OUT'];

/* ─────────────────────────────────────────
   CSV Parser
───────────────────────────────────────── */
function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return { headers: [], rows: [] };

    const raw = lines[0].split(',').map(h =>
        h.trim().toLowerCase().replace(/\s+/g, '_').replace(/['"]/g, '')
    );

    const rows = lines.slice(1).map((line, idx) => {
        const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
        const obj = { _row: idx + 2 };
        raw.forEach((h, i) => { obj[h] = values[i] ?? ''; });
        return obj;
    });

    return { headers: raw, rows };
}

/* ─────────────────────────────────────────
   Row validator
───────────────────────────────────────── */
function validateRow(row) {
    const errors = [];

    // Required check first
    REQUIRED_COLUMNS.forEach(col => {
        if (!row[col] || row[col].toString().trim() === '') {
            errors.push(`Kolom "${COLUMN_DISPLAY[col]}" wajib diisi.`);
        }
    });
    if (errors.length) return errors;

    // Date format YYYY-MM-DD
    const dateStr = row['tanggal'];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || isNaN(new Date(dateStr).getTime())) {
        errors.push(`Format tanggal tidak valid. Gunakan YYYY-MM-DD. Ditemukan: "${dateStr}"`);
    }

    // Volume numeric & positive
    const vol = parseFloat(row['volume']);
    if (isNaN(vol)) {
        errors.push(`Volume harus berupa angka. Ditemukan: "${row['volume']}"`);
    } else if (vol <= 0) {
        errors.push(`Volume harus lebih dari 0. Ditemukan: ${vol}`);
    }

    // Transaction type
    const txType = (row['jenis_transaksi'] || '').toUpperCase();
    if (!VALID_TRANSACTION_TYPES.includes(txType)) {
        errors.push(`Jenis transaksi harus IN atau OUT. Ditemukan: "${row['jenis_transaksi']}"`);
    }

    return errors;
}

/* ─────────────────────────────────────────
   Step Indicator
───────────────────────────────────────── */
function StepDot({ number, label, active, done }) {
    return (
        <div className={`flex items-center gap-2 transition-colors ${active ? 'text-amber-600' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all ${active
                ? 'border-amber-500 bg-amber-50 text-amber-600'
                : done
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-slate-200 bg-white text-slate-400'
                }`}
            >
                {done ? '✓' : number}
            </div>
            <span className="text-xs font-semibold hidden sm:block">{label}</span>
        </div>
    );
}

/* ─────────────────────────────────────────
   Import Modal
───────────────────────────────────────── */
export default function ImportModal({ onClose }) {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [parseResult, setParseResult] = useState(null);
    const [fileError, setFileError] = useState('');
    const [importing, setImporting] = useState(false);
    const [importLog, setImportLog] = useState([]);
    const [showLog, setShowLog] = useState(true);
    const fileInputRef = useRef(null);

    /* ── Process uploaded file ── */
    const processFile = useCallback((f) => {
        if (!f) return;
        setFileError('');

        const ext = f.name.split('.').pop().toLowerCase();
        if (!['csv', 'xlsx', 'xls'].includes(ext)) {
            setFileError(`Format file tidak didukung (.${ext}). Gunakan CSV atau Excel (.xlsx / .xls).`);
            return;
        }
        if (f.size > 10 * 1024 * 1024) {
            setFileError('Ukuran file terlalu besar. Maksimal 10 MB.');
            return;
        }

        setFile(f);

        if (ext === 'csv') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const { headers, rows } = parseCSV(e.target.result);

                // Column check
                const missing = REQUIRED_COLUMNS.filter(c => !headers.includes(c));
                if (missing.length > 0) {
                    setFileError(`Kolom wajib tidak ditemukan: ${missing.map(c => COLUMN_DISPLAY[c]).join(', ')}.`);
                    setFile(null);
                    return;
                }

                const validated = rows.map(row => {
                    const errs = validateRow(row);
                    return { ...row, _errors: errs, _valid: errs.length === 0 };
                });

                setParseResult({ headers: REQUIRED_COLUMNS, rows: validated, filename: f.name });
                setStep(2);
            };
            reader.readAsText(f);
        } else {
            // Excel: demo preview (real app: use xlsx library)
            const demoRows = [
                { _row: 2, tanggal: '2026-09-01', jenis_produk: 'CPO',      cluster_tank: 'Cluster A', volume: '1500.50', jenis_transaksi: 'IN',  _errors: [], _valid: true },
                { _row: 3, tanggal: '2026-09-02', jenis_produk: 'RBD OLEIN',cluster_tank: 'Cluster B', volume: '850.25',  jenis_transaksi: 'OUT', _errors: [], _valid: true },
                { _row: 4, tanggal: '2026-09-03', jenis_produk: 'PKO',      cluster_tank: 'Cluster C', volume: 'ABC',     jenis_transaksi: 'IN',  _errors: ['Volume harus berupa angka. Ditemukan: "ABC"'], _valid: false },
                { _row: 5, tanggal: 'bad-date',   jenis_produk: 'CPO',      cluster_tank: 'Cluster A', volume: '2000',    jenis_transaksi: 'IN',  _errors: ['Format tanggal tidak valid. Gunakan YYYY-MM-DD. Ditemukan: "bad-date"'], _valid: false },
                { _row: 6, tanggal: '2026-09-05', jenis_produk: 'PFAD',     cluster_tank: 'Cluster D', volume: '3200.00', jenis_transaksi: 'OUT', _errors: [], _valid: true },
                { _row: 7, tanggal: '2026-09-06', jenis_produk: 'RBDPO',    cluster_tank: 'Cluster B', volume: '980.00',  jenis_transaksi: 'IN',  _errors: [], _valid: true },
            ];
            setParseResult({ headers: REQUIRED_COLUMNS, rows: demoRows, filename: f.name, isExcelMock: true });
            setStep(2);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        processFile(e.dataTransfer.files[0]);
    }, [processFile]);

    const validRows = parseResult?.rows.filter(r => r._valid) ?? [];
    const errorRows = parseResult?.rows.filter(r => !r._valid) ?? [];

    /* ── Confirm import ── */
    const handleConfirmImport = () => {
        setImporting(true);
        setTimeout(() => {
            const now = new Date().toLocaleTimeString('id-ID');
            setImportLog([
                { time: now, msg: `File "${parseResult.filename}" berhasil diproses.`, type: 'info' },
                { time: now, msg: `${validRows.length} baris data valid berhasil diimpor ke sistem.`, type: 'success' },
                ...(errorRows.length > 0
                    ? [{ time: now, msg: `${errorRows.length} baris dilewati karena validasi gagal.`, type: 'warning' }]
                    : []),
                { time: now, msg: 'Proses import selesai. Data siap digunakan.', type: 'info' },
            ]);
            setImporting(false);
            setStep(3);
        }, 1600);
    };

    /* ─────────────────────────────────────────
       Render
    ───────────────────────────────────────── */
    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">

                {/* ── Modal Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                            <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 text-sm">Import Data Transaksi</h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">Upload file CSV atau Excel untuk mengimpor data transaksi minyak</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Step Indicator ── */}
                <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 shrink-0">
                    <StepDot number={1} label="Upload File"        active={step === 1} done={step > 1} />
                    <div className="flex-1 h-px bg-slate-100" />
                    <StepDot number={2} label="Preview & Validasi" active={step === 2} done={step > 2} />
                    <div className="flex-1 h-px bg-slate-100" />
                    <StepDot number={3} label="Selesai"            active={step === 3} done={false} />
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">

                    {/* ═══ STEP 1: UPLOAD ═══ */}
                    {step === 1 && (
                        <>
                            {/* Instructions */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <h3 className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-2">
                                    <Info className="w-3.5 h-3.5" />
                                    Panduan Format File
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-amber-700">
                                    <p>• Format: <strong>CSV, XLSX, XLS</strong></p>
                                    <p>• Ukuran maks: <strong>10 MB</strong></p>
                                    <p>• Format tanggal: <strong>YYYY-MM-DD</strong></p>
                                    <p>• Jenis transaksi: <strong>IN</strong> atau <strong>OUT</strong></p>
                                    <p className="sm:col-span-2">
                                        • Kolom wajib:{' '}
                                        <strong>{REQUIRED_COLUMNS.map(c => COLUMN_DISPLAY[c]).join(', ')}</strong>
                                    </p>
                                </div>
                            </div>

                            {/* Drop zone */}
                            <div
                                onDrop={handleDrop}
                                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl py-12 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${
                                    isDragging
                                        ? 'border-amber-500 bg-amber-50 scale-[1.01]'
                                        : 'border-slate-200 hover:border-amber-400 hover:bg-amber-50/40'
                                }`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-amber-100' : 'bg-slate-100'}`}>
                                    <Upload className={`w-7 h-7 transition-colors ${isDragging ? 'text-amber-500' : 'text-slate-400'}`} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-slate-600">
                                        {isDragging ? 'Lepaskan file di sini...' : 'Klik atau seret file ke sini'}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        CSV, XLSX, XLS &nbsp;·&nbsp; Maks. 10 MB
                                    </p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    className="hidden"
                                    onChange={e => processFile(e.target.files[0])}
                                />
                            </div>

                            {/* File error */}
                            {fileError && (
                                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3.5">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    {fileError}
                                </div>
                            )}
                        </>
                    )}

                    {/* ═══ STEP 2: PREVIEW ═══ */}
                    {step === 2 && parseResult && (
                        <>
                            {/* Summary badges */}
                            <div className="flex flex-wrap gap-2">
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                                    {parseResult.filename}
                                </span>
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-700">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {validRows.length} baris valid
                                </span>
                                {errorRows.length > 0 && (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        {errorRows.length} baris error
                                    </span>
                                )}
                                {parseResult.isExcelMock && (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] font-medium text-blue-700">
                                        <Info className="w-3.5 h-3.5" />
                                        Preview Excel (demo)
                                    </span>
                                )}
                            </div>

                            {/* Preview table */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="px-3 py-2.5 text-left font-bold text-slate-500 w-12 whitespace-nowrap">Baris</th>
                                                <th className="px-3 py-2.5 text-left font-bold text-slate-500 w-14">Status</th>
                                                {REQUIRED_COLUMNS.map(col => (
                                                    <th key={col} className="px-3 py-2.5 text-left font-bold text-slate-500 whitespace-nowrap">
                                                        {COLUMN_DISPLAY[col]}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {parseResult.rows.map(row => (
                                                <tr
                                                    key={row._row}
                                                    className={`transition-colors ${row._valid ? 'hover:bg-slate-50' : 'bg-red-50/60'}`}
                                                >
                                                    <td className="px-3 py-2 text-slate-400 font-mono">{row._row}</td>
                                                    <td className="px-3 py-2">
                                                        {row._valid ? (
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                        ) : (
                                                            <div className="group relative inline-block">
                                                                <AlertCircle className="w-3.5 h-3.5 text-red-500 cursor-help" />
                                                                <div className="hidden group-hover:block absolute left-0 top-5 w-64 bg-slate-800 text-white text-[10px] rounded-lg p-2.5 shadow-xl z-20 leading-relaxed">
                                                                    {row._errors.map((err, i) => (
                                                                        <p key={i} className="mb-0.5">• {err}</p>
                                                                    ))}
                                                                    <div className="absolute -top-1 left-2 w-2 h-2 bg-slate-800 rotate-45" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    {REQUIRED_COLUMNS.map(col => (
                                                        <td
                                                            key={col}
                                                            className={`px-3 py-2 whitespace-nowrap ${
                                                                !row._valid && (!row[col] || row[col] === '')
                                                                    ? 'text-red-400 italic'
                                                                    : 'text-slate-700'
                                                            }`}
                                                        >
                                                            {row[col] || <span className="text-red-300">—</span>}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Error warning */}
                            {errorRows.length > 0 && (
                                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                                    <span>
                                        <strong>{errorRows.length} baris</strong> tidak akan diimpor karena terdapat error.
                                        Hover pada ikon ⚠ untuk melihat detail error per baris.
                                    </span>
                                </div>
                            )}

                            {/* No valid rows */}
                            {validRows.length === 0 && (
                                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-700">
                                    <FileX className="w-4 h-4 shrink-0 mt-0.5" />
                                    Tidak ada baris valid untuk diimpor. Periksa kembali format file Anda.
                                </div>
                            )}
                        </>
                    )}

                    {/* ═══ STEP 3: DONE ═══ */}
                    {step === 3 && (
                        <>
                            <div className="text-center py-6">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Import Berhasil!</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    {validRows.length} data transaksi berhasil diimpor ke sistem.
                                </p>
                            </div>

                            {/* Import Log */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setShowLog(v => !v)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-bold text-slate-600 uppercase tracking-wider"
                                >
                                    <span className="flex items-center gap-2">
                                        <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                                        Log Aktivitas Import
                                    </span>
                                    {showLog ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                                {showLog && (
                                    <div className="p-4 space-y-2 bg-slate-900 rounded-b-xl font-mono">
                                        {importLog.map((log, i) => (
                                            <div key={i} className={`flex items-start gap-3 text-[11px] ${
                                                log.type === 'success' ? 'text-emerald-400'
                                                : log.type === 'warning' ? 'text-amber-400'
                                                : 'text-slate-400'
                                            }`}>
                                                <span className="text-slate-600 shrink-0">[{log.time}]</span>
                                                <span>{log.msg}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Footer Actions ── */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors"
                    >
                        {step === 3 ? 'Tutup' : 'Batal'}
                    </button>

                    <div className="flex items-center gap-2">
                        {step === 2 && (
                            <>
                                <button
                                    onClick={() => { setStep(1); setFile(null); setParseResult(null); setFileError(''); }}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors"
                                >
                                    ← Kembali
                                </button>
                                <button
                                    id="confirm-import-btn"
                                    onClick={handleConfirmImport}
                                    disabled={validRows.length === 0 || importing}
                                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95"
                                >
                                    {importing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Mengimpor...
                                        </>
                                    ) : (
                                        `Import ${validRows.length} Baris`
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
