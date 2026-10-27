<?php
/**
 * SORS - Import Controller
 * Handles: CSV & Excel (.xlsx, .xls) upload & UPSERT (handling duplikasi) ke tabel oil_transaction
 */

require_once __DIR__ . '/../config/database.php';

class ImportController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    // POST /import/transactions
    // Mendukung: multipart/form-data (CSV / Excel .xlsx/.xls) atau application/json (array rows)
    public function importFile(): array {
        // Opsi 1: JSON bulk array dari frontend
        $rawInput = file_get_contents('php://input');
        if (!empty($rawInput)) {
            $json = json_decode($rawInput, true);
            if (is_array($json) && isset($json['rows'])) {
                return $this->processBulkRows($json['rows']);
            }
        }

        // Opsi 2: Upload file (CSV / Excel)
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            return ["success" => false, "message" => "Silakan unggah dokumen CSV atau Excel yang valid."];
        }

        $fileTmpPath = $_FILES['file']['tmp_name'];
        $fileName    = $_FILES['file']['name'];
        $fileExt     = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        if (!in_array($fileExt, ['csv', 'txt', 'xlsx', 'xls'])) {
            http_response_code(400);
            return ["success" => false, "message" => "Format '.$fileExt' tidak didukung. Harap gunakan file CSV atau Excel (.xlsx / .xls)."];
        }

        if (in_array($fileExt, ['xlsx', 'xls'])) {
            return $this->processXlsxFile($fileTmpPath);
        } else {
            return $this->processCsvFile($fileTmpPath);
        }
    }

    // ---- Parse File Excel (.xlsx / .xls) ----
    private function processXlsxFile(string $filePath): array {
        if (!class_exists('ZipArchive')) {
            // Fallback jika ekstensi ZipArchive belum aktif di php.ini
            return $this->processCsvFile($filePath);
        }

        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            // Fallback jika file .xls (BIFF8/CSV format)
            return $this->processCsvFile($filePath);
        }

        // 1. Baca shared strings
        $sharedStrings = [];
        $sharedStringsXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($sharedStringsXml !== false) {
            $xml = @simplexml_load_string($sharedStringsXml);
            if ($xml && isset($xml->si)) {
                foreach ($xml->si as $val) {
                    if (isset($val->t)) {
                        $sharedStrings[] = (string)$val->t;
                    } else {
                        $text = '';
                        if (isset($val->r)) {
                            foreach ($val->r as $r) {
                                $text .= (string)$r->t;
                            }
                        }
                        $sharedStrings[] = $text;
                    }
                }
            }
        }

        // 2. Baca sheet data (sheet1.xml atau sheet pertama yang ditemukan)
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        if ($sheetXml === false) {
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $name = $zip->getNameIndex($i);
                if (strpos($name, 'xl/worksheets/sheet') === 0 && (substr($name, -4) === '.xml')) {
                    $sheetXml = $zip->getFromName($name);
                    break;
                }
            }
        }

        $zip->close();

        if ($sheetXml === false) {
            http_response_code(400);
            return ["success" => false, "message" => "Sheet data tidak ditemukan dalam dokumen Excel."];
        }

        $xml = @simplexml_load_string($sheetXml);
        if (!$xml || !isset($xml->sheetData->row)) {
            http_response_code(400);
            return ["success" => false, "message" => "Format baris data Excel tidak valid."];
        }

        $rawRows = [];
        foreach ($xml->sheetData->row as $row) {
            $rowCells = [];
            $maxCol = 0;
            foreach ($row->c as $cell) {
                $r = (string)$cell['r'];
                $type = (string)$cell['t'];
                $val  = (string)$cell->v;

                if ($type === 's' && isset($sharedStrings[(int)$val])) {
                    $val = $sharedStrings[(int)$val];
                }

                if (preg_match('/^([A-Z]+)(\d+)$/i', $r, $m)) {
                    $colIdx = $this->colLetterToIndex($m[1]);
                    $rowCells[$colIdx] = $val;
                    if ($colIdx > $maxCol) $maxCol = $colIdx;
                } else {
                    $rowCells[] = $val;
                }
            }

            // Presisi indeks kolom Excel (A=0, B=1, dst)
            $fullRow = [];
            for ($c = 0; $c <= max($maxCol, 34); $c++) {
                $fullRow[$c] = $rowCells[$c] ?? '';
            }
            $rawRows[] = $fullRow;
        }

        $rows = $this->parseRowArrays($rawRows);
        return $this->processBulkRows($rows);
    }

    private function colLetterToIndex(string $col): int {
        $col = strtoupper($col);
        $len = strlen($col);
        $idx = 0;
        for ($i = 0; $i < $len; $i++) {
            $idx = $idx * 26 + (ord($col[$i]) - ord('A') + 1);
        }
        return $idx - 1;
    }

    // ---- Parse File CSV ----
    private function processCsvFile(string $filePath): array {
        $handle = fopen($filePath, "r");
        if ($handle === false) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal membuka file yang diunggah."];
        }

        $rawRows = [];
        while (($data = fgetcsv($handle, 8192, ",")) !== false) {
            $rawRows[] = $data;
        }
        fclose($handle);

        $rows = $this->parseRowArrays($rawRows);
        return $this->processBulkRows($rows);
    }

    // ---- Konversi Matriks Baris ke Struktur Transaksi ----
    private function parseRowArrays(array $rawRows): array {
        $rows = [];

        // Deteksi dinamis kolom Control Find (Suhu & Sounding) HANYA dari 5 baris pertama (header)
        $tempCol = null;
        $deltaTempCol = null;
        $soundingCol = null;
        $deltaSoundingCol = null;

        $headerRows = array_slice($rawRows, 0, 5);
        foreach ($headerRows as $row) {
            foreach ($row as $idx => $cell) {
                if ($idx < 25) continue; // Kolom Control Find selalu berada di area akhir (kolom >= 25)
                $cellStr = strtolower(trim((string)$cell));
                if (empty($cellStr)) continue;

                $hasDelta = (strpos($cellStr, 'delta') !== false || strpos($cellStr, 'Δ') !== false || strpos($cellStr, 'd-') !== false);

                if ($deltaTempCol === null && $hasDelta && preg_match('/suhu|temp|°c|°/i', $cellStr)) {
                    $deltaTempCol = $idx;
                } elseif ($tempCol === null && !$hasDelta && preg_match('/suhu|temp|°c|°/i', $cellStr)) {
                    $tempCol = $idx;
                } elseif ($deltaSoundingCol === null && $hasDelta && (strpos($cellStr, 'sounding') !== false || preg_match('/cm\b/i', $cellStr))) {
                    $deltaSoundingCol = $idx;
                } elseif ($soundingCol === null && !$hasDelta && (strpos($cellStr, 'sounding') !== false || preg_match('/cm\b/i', $cellStr))) {
                    $soundingCol = $idx;
                }
            }
        }

        foreach ($rawRows as $data) {
            if (empty($data) || count($data) < 5) continue;

            $dateRaw = trim((string)($data[0] ?? ''));
            if (empty($dateRaw)) continue;

            // Validasi tanggal: Serial Excel (misal 46234) ATAU format tanggal biasa (31/07/2026 / 2026-07-31)
            $isValidDate = (is_numeric($dateRaw) && (float)$dateRaw > 30000 && (float)$dateRaw < 100000)
                || preg_match('/^\d{1,4}[\/\.-]\d{1,2}[\/\.-]\d{1,4}/', $dateRaw);

            if (!$isValidDate) {
                continue;
            }

            $parsedDate = $this->parseDate($dateRaw);

            // Cek apakah kolom ke-1 adalah T-Farm (misal: "C - 1", "C-RM", "A - 2")
            $isTfarm = preg_match('/^[A-Za-z]\s*-\s*[A-Za-z0-9]+$/i', trim((string)($data[1] ?? '')));
            $offset  = $isTfarm ? 0 : -1;

            $tank              = trim((string)($data[2 + $offset] ?? ''));
            $product_tankfarm  = trim((string)($data[3 + $offset] ?? ''));
            $product_name      = trim((string)($data[4 + $offset] ?? ''));

            if (empty($tank)) continue;

            $rows[] = [
                'transaction_date'     => $parsedDate,
                'tank'                 => $tank,
                'product_tankfarm'     => $product_tankfarm,
                'product_name'         => $product_name,
                'beginning_stock'      => $this->parseNumber($data[5 + $offset] ?? 0),
                'ending_stock'         => $this->parseNumber($data[6 + $offset] ?? 0),
                'perak_supplier_in'    => $this->parseNumber($data[7 + $offset] ?? 0),
                'perak_supplier_out'   => $this->parseNumber($data[8 + $offset] ?? 0),
                'refinery_nss_in'      => $this->parseNumber($data[9 + $offset] ?? 0),
                'refinery_nss_out'     => $this->parseNumber($data[10 + $offset] ?? 0),
                'fractionation_in'     => $this->parseNumber($data[11 + $offset] ?? 0),
                'fractionation_out'    => $this->parseNumber($data[12 + $offset] ?? 0),
                'marg_plant_in'        => $this->parseNumber($data[13 + $offset] ?? 0),
                'marg_plant_out'       => $this->parseNumber($data[14 + $offset] ?? 0),
                'filling_plant_in'     => $this->parseNumber($data[15 + $offset] ?? 0),
                'filling_plant_out'    => $this->parseNumber($data[16 + $offset] ?? 0),
                'gbj_in'               => $this->parseNumber($data[17 + $offset] ?? 0),
                'gbj_out'              => $this->parseNumber($data[18 + $offset] ?? 0),
                'others_in'            => $this->parseNumber($data[19 + $offset] ?? 0),
                'others_out'           => $this->parseNumber($data[20 + $offset] ?? 0),
                'transfer_in1'         => $this->parseNumber($data[21 + $offset] ?? 0),
                'transfer_in2'         => $this->parseNumber($data[22 + $offset] ?? 0),
                'transfer_out'         => $this->parseNumber($data[23 + $offset] ?? 0),
                'mat_to_mat_out'       => $this->parseNumber($data[24 + $offset] ?? 0),
                'customer_in'          => $this->parseNumber($data[25 + $offset] ?? 0),
                'gl_amount'            => $this->parseNumber($data[26 + $offset] ?? 0),
                'gl_percentage'        => $this->parsePercent($data[27 + $offset] ?? 0),
                'over_threshold'       => trim((string)($data[28 + $offset] ?? '')),
                'cause_analysis'       => trim((string)($data[29 + $offset] ?? '')),
                // Control Find (Posisi otomatis dari header jika ada, atau fallback offset)
                'sounding_cm'          => $this->parseNumber($data[$soundingCol ?? (30 + $offset)] ?? 0),
                'delta_cm'             => $this->parseNumber($data[$deltaSoundingCol ?? (31 + $offset)] ?? 0),
                'temperature_c'        => $this->parseNumber($data[$tempCol ?? (32 + $offset)] ?? 0),
                'delta_temperature_c'  => $this->parseNumber($data[$deltaTempCol ?? (33 + $offset)] ?? 0)
            ];
        }

        return $rows;
    }

    // ---- Bulk Insert / Update (UPSERT Handling Duplikasi) ----
    private function processBulkRows(array $rows): array {
        if (empty($rows)) {
            http_response_code(400);
            return ["success" => false, "message" => "Tidak ada data transaksi valid dalam file."];
        }

        try {
            $this->db->beginTransaction();

            // Statement Cek Duplikasi Presisi Tinggi (Tanggal + Tangki + Product Name + Product Tankfarm)
            $checkStmt = $this->db->prepare(
                "SELECT id FROM oil_transaction 
                 WHERE transaction_date = :date 
                   AND tank = :tank 
                   AND COALESCE(product_name, '') = :product_name 
                   AND COALESCE(product_tankfarm, '') = :product_tankfarm"
            );

            // Statement INSERT jika data baru
            $insertSql = "INSERT INTO oil_transaction (
                            transaction_date, tank, product_tankfarm, product_name,
                            beginning_stock, ending_stock,
                            perak_supplier_in, perak_supplier_out,
                            refinery_nss_in, refinery_nss_out,
                            fractionation_in, fractionation_out,
                            marg_plant_in, marg_plant_out,
                            filling_plant_in, filling_plant_out,
                            gbj_in, gbj_out,
                            others_in, others_out,
                            transfer_in1, transfer_in2, transfer_out,
                            mat_to_mat_out, customer_in,
                            gl_amount, gl_percentage, over_threshold, cause_analysis,
                            sounding_cm, delta_cm, temperature_c, delta_temperature_c
                        ) VALUES (
                            :transaction_date, :tank, :product_tankfarm, :product_name,
                            :beginning_stock, :ending_stock,
                            :perak_supplier_in, :perak_supplier_out,
                            :refinery_nss_in, :refinery_nss_out,
                            :fractionation_in, :fractionation_out,
                            :marg_plant_in, :marg_plant_out,
                            :filling_plant_in, :filling_plant_out,
                            :gbj_in, :gbj_out,
                            :others_in, :others_out,
                            :transfer_in1, :transfer_in2, :transfer_out,
                            :mat_to_mat_out, :customer_in,
                            :gl_amount, :gl_percentage, :over_threshold, :cause_analysis,
                            :sounding_cm, :delta_cm, :temperature_c, :delta_temperature_c
                        )";
            $insertStmt = $this->db->prepare($insertSql);

            $insertedCount = 0;
            $skippedCount  = 0;

            foreach ($rows as $row) {
                $tdate = $row['transaction_date'] ?? date('Y-m-d');
                $tank  = $row['tank'] ?? '-';
                $glPercent     = (float)($row['gl_percentage'] ?? 0);
                $overThreshold = $row['over_threshold'] ?? '';
                if (empty($overThreshold) && abs($glPercent) > 0.2) {
                    $overThreshold = 'Yes';
                }

                // Cek ketersediaan di database (Presisi: Tanggal + Tangki + Product Name + Product Tankfarm)
                $prodName     = $row['product_name'] ?? '';
                $prodTankfarm = $row['product_tankfarm'] ?? '';
                $checkStmt->execute([
                    ':date'             => $tdate,
                    ':tank'             => $tank,
                    ':product_name'     => $prodName,
                    ':product_tankfarm' => $prodTankfarm,
                ]);
                $existing = $checkStmt->fetch(\PDO::FETCH_ASSOC);

                // Jika data sudah ada, OTOMATIS SKIP (TIDAK DIPERBARUI) sesuai permintaan pengguna
                if ($existing) {
                    $skippedCount++;
                    continue;
                }

                $params = [
                    ':transaction_date'     => $tdate,
                    ':tank'                 => $tank,
                    ':product_tankfarm'     => $row['product_tankfarm'] ?? '',
                    ':product_name'         => $row['product_name'] ?? '',
                    ':beginning_stock'      => (float)($row['beginning_stock'] ?? 0),
                    ':ending_stock'         => (float)($row['ending_stock'] ?? 0),
                    ':perak_supplier_in'    => (float)($row['perak_supplier_in'] ?? 0),
                    ':perak_supplier_out'   => (float)($row['perak_supplier_out'] ?? 0),
                    ':refinery_nss_in'      => (float)($row['refinery_nss_in'] ?? 0),
                    ':refinery_nss_out'     => (float)($row['refinery_nss_out'] ?? 0),
                    ':fractionation_in'     => (float)($row['fractionation_in'] ?? 0),
                    ':fractionation_out'    => (float)($row['fractionation_out'] ?? 0),
                    ':marg_plant_in'        => (float)($row['marg_plant_in'] ?? 0),
                    ':marg_plant_out'       => (float)($row['marg_plant_out'] ?? 0),
                    ':filling_plant_in'     => (float)($row['filling_plant_in'] ?? 0),
                    ':filling_plant_out'    => (float)($row['filling_plant_out'] ?? 0),
                    ':gbj_in'               => (float)($row['gbj_in'] ?? 0),
                    ':gbj_out'              => (float)($row['gbj_out'] ?? 0),
                    ':others_in'            => (float)($row['others_in'] ?? 0),
                    ':others_out'           => (float)($row['others_out'] ?? 0),
                    ':transfer_in1'         => (float)($row['transfer_in1'] ?? 0),
                    ':transfer_in2'         => (float)($row['transfer_in2'] ?? 0),
                    ':transfer_out'         => (float)($row['transfer_out'] ?? 0),
                    ':mat_to_mat_out'       => (float)($row['mat_to_mat_out'] ?? 0),
                    ':customer_in'          => (float)($row['customer_in'] ?? 0),
                    ':gl_amount'            => (float)($row['gl_amount'] ?? 0),
                    ':gl_percentage'        => $glPercent,
                    ':over_threshold'       => $overThreshold,
                    ':cause_analysis'       => $row['cause_analysis'] ?? '',
                    ':sounding_cm'          => (float)($row['sounding_cm'] ?? 0),
                    ':delta_cm'             => (float)($row['delta_cm'] ?? 0),
                    ':temperature_c'        => (float)($row['temperature_c'] ?? 0),
                    ':delta_temperature_c'  => (float)($row['delta_temperature_c'] ?? 0)
                ];

                $insertStmt->execute($params);
                $insertedCount++;
            }

            $this->db->commit();

            if ($insertedCount > 0 && $skippedCount > 0) {
                $msg = "Berhasil mengimpor {$insertedCount} data transaksi baru ({$skippedCount} data duplikat otomatis dilewati).";
            } elseif ($insertedCount > 0) {
                $msg = "Berhasil mengimpor {$insertedCount} data transaksi baru.";
            } else {
                $msg = "Tidak ada data baru yang diimpor ({$skippedCount} data duplikat otomatis dilewati).";
            }

            http_response_code(201);
            return [
                "success" => true,
                "message" => $msg,
                "data"    => [
                    "total_rows"      => count($rows),
                    "inserted_count"  => $insertedCount,
                    "skipped_count"   => $skippedCount,
                ]
            ];

        } catch (Exception $e) {
            $this->db->rollBack();
            http_response_code(500);
            return ["success" => false, "message" => "Gagal mengimpor data: " . $e->getMessage()];
        }
    }

    // ---- Utility Parsers ----
    private function parseNumber($val): float {
        if ($val === null || $val === '') return 0.0;
        $str = trim((string)$val);
        if ($str === '' || $str === '-') return 0.0;
        $str = str_replace(['"', ' '], '', $str);
        if (preg_match('/^-?\d{1,3}(,\d{3})+(\.\d+)?$/', $str)) {
            $str = str_replace(',', '', $str);
        } else {
            $str = str_replace(',', '.', $str);
        }
        return is_numeric($str) ? (float)$str : 0.0;
    }

    private function parsePercent($val): float {
        if ($val === null || $val === '') return 0.0;
        $str = str_replace(['%', '"', ' '], '', (string)$val);
        $num = $this->parseNumber($str);
        if (abs($num) > 0 && abs($num) < 1 && strpos((string)$val, '%') === false) {
            $num = $num * 100;
        }
        return $num;
    }

    private function parseDate($val): string {
        if ($val === null || $val === '') return date('Y-m-d');
        $val = trim((string)$val);

        // Excel serial date (misal 46234 = 31/07/2026)
        if (is_numeric($val) && (float)$val > 30000 && (float)$val < 100000) {
            $unixTimestamp = ((float)$val - 25569) * 86400;
            return gmdate('Y-m-d', (int)$unixTimestamp);
        }

        // Format DD/MM/YYYY atau DD-MM-YYYY atau DD.MM.YYYY -> YYYY-MM-DD
        if (preg_match('/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/', $val, $m)) {
            $day   = str_pad($m[1], 2, '0', STR_PAD_LEFT);
            $month = str_pad($m[2], 2, '0', STR_PAD_LEFT);
            return "{$m[3]}-{$month}-{$day}";
        }

        // Format YYYY-MM-DD
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $val)) {
            return $val;
        }

        $time = strtotime($val);
        return $time ? date('Y-m-d', $time) : date('Y-m-d');
    }
}
