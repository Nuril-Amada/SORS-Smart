<?php
/**
 * SORS - Export Controller
 * POST /export/pdf   - Export data transaksi + visualisasi ke PDF (via HTML print)
 * GET  /export/csv   - Export data transaksi ke CSV
 *
 * Filter params: dateFrom, dateTo, product, cluster
 */

require_once __DIR__ . '/../config/database.php';

class ExportController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    // ─────────────────────────────────────────────────────────────
    // GET /export/csv
    // Download file CSV dari data oil_transaction sesuai filter
    // ─────────────────────────────────────────────────────────────
    public function exportCsv(array $params): void {
        $wc       = $this->buildWhere($params);
        $filename = 'SORS_Transaksi_' . date('Ymd_His') . '.csv';

        $sql = "SELECT
                    CONVERT(VARCHAR(10), transaction_date, 23) AS Tanggal,
                    tank                AS Tank,
                    product_tankfarm    AS [Product Tankfarm],
                    product_name        AS [Nama Produk],
                    beginning_stock     AS [Beginning Stock],
                    ending_stock        AS [Ending Stock],
                    perak_supplier_in   AS [Perak-Supplier IN],
                    perak_supplier_out  AS [Perak-Supplier OUT],
                    refinery_nss_in     AS [Refinery-NSS IN],
                    refinery_nss_out    AS [Refinery-NSS OUT],
                    fractionation_in    AS [Fractionation IN],
                    fractionation_out   AS [Fractionation OUT],
                    marg_plant_in       AS [Marg Plant IN],
                    marg_plant_out      AS [Marg Plant OUT],
                    filling_plant_in    AS [Filling Plant IN],
                    filling_plant_out   AS [Filling Plant OUT],
                    gbj_in              AS [GBJ IN],
                    gbj_out             AS [GBJ OUT],
                    others_in           AS [Others IN],
                    others_out          AS [Others OUT],
                    transfer_in1        AS [Transfer IN 1],
                    transfer_in2        AS [Transfer IN 2],
                    transfer_out        AS [Transfer OUT],
                    mat_to_mat_out      AS [Mat To Mat OUT],
                    customer_in         AS [Customer IN],
                    gl_amount           AS [GL Amount (KG)],
                    gl_percentage       AS [GL %],
                    over_threshold      AS [Over Threshold],
                    cause_analysis      AS [Analisa Penyebab],
                    sounding_cm         AS [Sounding (Cm)],
                    delta_cm            AS [ΔCm],
                    temperature_c       AS [Suhu (°C)],
                    delta_temperature_c AS [Δ°C]
                FROM oil_transaction" . $wc['where'] . "
                ORDER BY transaction_date ASC, tank ASC";

        $stmt = $this->db->prepare($sql);
        foreach ($wc['bindings'] as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Output CSV
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: no-cache, no-store, must-revalidate');

        $out = fopen('php://output', 'w');
        // BOM untuk Excel (UTF-8)
        fputs($out, "\xEF\xBB\xBF");

        if (!empty($rows)) {
            fputcsv($out, array_keys($rows[0]));
            foreach ($rows as $row) {
                fputcsv($out, $row);
            }
        }
        fclose($out);
        exit;
    }

    // ─────────────────────────────────────────────────────────────
    // GET /export/pdf-data
    // Mengembalikan JSON lengkap (transaksi + ringkasan KPI + pareto)
    // untuk dirender oleh frontend menjadi PDF (via print/window.print).
    // ─────────────────────────────────────────────────────────────
    public function exportPdfData(array $params): array {
        try {
            $wc = $this->buildWhere($params);

            // 1. KPI ringkasan
            $totalInExpr  = "perak_supplier_in + refinery_nss_in + fractionation_in + marg_plant_in +
                              filling_plant_in + gbj_in + others_in + transfer_in1 + transfer_in2";
            $totalOutExpr = "perak_supplier_out + refinery_nss_out + fractionation_out + marg_plant_out +
                              filling_plant_out + gbj_out + others_out + transfer_out + mat_to_mat_out + customer_in";

            $kpiStmt = $this->db->prepare(
                "SELECT
                    SUM(beginning_stock)   AS beginning,
                    SUM(ending_stock)      AS ending,
                    SUM($totalInExpr)      AS total_in,
                    SUM($totalOutExpr)     AS total_out,
                    SUM(gl_amount)         AS net_gl,
                    AVG(temperature_c)     AS avg_temp,
                    COUNT(*)               AS total_rows
                 FROM oil_transaction" . $wc['where']
            );
            foreach ($wc['bindings'] as $k => $v) $kpiStmt->bindValue($k, $v);
            $kpiStmt->execute();
            $kpi = $kpiStmt->fetch();

            // 2. Pareto analisa penyebab
            $paretoStmt = $this->db->prepare(
                "SELECT cause_analysis, COUNT(*) AS jumlah, SUM(ABS(gl_amount)) AS total_gl
                 FROM oil_transaction" . $wc['where'] . "
                 AND cause_analysis IS NOT NULL AND cause_analysis != ''
                 GROUP BY cause_analysis ORDER BY jumlah DESC"
            );
            foreach ($wc['bindings'] as $k => $v) $paretoStmt->bindValue($k, $v);
            $paretoStmt->execute();
            $pareto = $paretoStmt->fetchAll();

            // 3. Per-tangki summary
            $tankStmt = $this->db->prepare(
                "SELECT tank, product_name,
                        SUM(beginning_stock) AS beginning,
                        SUM(ending_stock)    AS ending,
                        SUM(gl_amount)       AS gl,
                        MAX(CASE WHEN over_threshold = 'Yes' THEN 1 ELSE 0 END) AS has_alert
                 FROM oil_transaction" . $wc['where'] . "
                 GROUP BY tank, product_name ORDER BY tank ASC"
            );
            foreach ($wc['bindings'] as $k => $v) $tankStmt->bindValue($k, $v);
            $tankStmt->execute();
            $tanks = $tankStmt->fetchAll();

            // 4. Tren harian (untuk chart di PDF)
            $trendStmt = $this->db->prepare(
                "SELECT CONVERT(VARCHAR(10), transaction_date, 23) AS date,
                        SUM($totalInExpr) AS total_in,
                        SUM($totalOutExpr) AS total_out,
                        SUM(gl_amount) AS gl
                 FROM oil_transaction" . $wc['where'] . "
                 GROUP BY transaction_date ORDER BY transaction_date ASC"
            );
            foreach ($wc['bindings'] as $k => $v) $trendStmt->bindValue($k, $v);
            $trendStmt->execute();
            $trend = $trendStmt->fetchAll();

            return [
                "success" => true,
                "data"    => [
                    "kpi"           => $kpi,
                    "pareto"        => $pareto,
                    "tanks"         => $tanks,
                    "daily_trend"   => $trend,
                    "filter"        => [
                        "dateFrom" => $params['dateFrom'] ?? '',
                        "dateTo"   => $params['dateTo'] ?? '',
                        "product"  => $params['product'] ?? 'Semua Produk',
                        "cluster"  => $params['cluster'] ? 'Cluster ' . strtoupper($params['cluster']) : 'Semua Cluster',
                    ],
                    "generated_at"  => date('Y-m-d H:i:s'),
                ]
            ];

        } catch (\PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal menyiapkan data export: " . $e->getMessage()];
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Helper: build WHERE clause
    // ─────────────────────────────────────────────────────────────
    private function buildWhere(array $params): array {
        $conditions = [];
        $bindings   = [];

        if (!empty($params['dateFrom'])) {
            $conditions[] = "transaction_date >= :dateFrom";
            $bindings[':dateFrom'] = $params['dateFrom'];
        }
        if (!empty($params['dateTo'])) {
            $conditions[] = "transaction_date <= :dateTo";
            $bindings[':dateTo'] = $params['dateTo'];
        }
        if (!empty($params['product']) && $params['product'] !== 'Semua Produk') {
            $conditions[] = "product_name = :product";
            $bindings[':product'] = $params['product'];
        }
        if (!empty($params['cluster']) && strtoupper($params['cluster']) !== 'SEMUA CLUSTER') {
            $c = strtoupper(trim($params['cluster']));
            if ($c === 'C') {
                $conditions[] = "(tank LIKE 'TC%' OR tank LIKE 'C-%')";
            } elseif ($c === 'F') {
                $conditions[] = "(tank LIKE 'TF%' OR tank LIKE 'TTF%')";
            } else {
                $conditions[] = "(tank LIKE :cluster_prefix OR tank LIKE :cluster_raw)";
                $bindings[':cluster_prefix'] = 'T' . $c . '%';
                $bindings[':cluster_raw']    = $c . '%';
            }
        }

        $where = !empty($conditions) ? " WHERE " . implode(" AND ", $conditions) : "";
        return ['where' => $where, 'bindings' => $bindings];
    }
}
