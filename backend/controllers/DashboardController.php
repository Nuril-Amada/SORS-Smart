<?php
/**
 * SORS - Dashboard Controller
 * Endpoints:
 *   GET /dashboard/kpi              - KPI Cards
 *   GET /dashboard/daily-trend      - Tren Transaksi Harian (DailyTrendChart)
 *   GET /dashboard/gain-loss        - Tren Gain/Loss Harian (GainLossTrendChart)
 *   GET /dashboard/stock-distribution - Distribusi Stok (StockDistributionChart)
 *   GET /dashboard/transaction-by-unit - Volume per Cluster/Tangki (TransactionByUnitChart)
 */

require_once __DIR__ . '/../config/database.php';

class DashboardController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    // ── Helper: bangun WHERE clause dari query params ──────────────
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

    private function execQuery(string $sql, array $bindings): array {
        $stmt = $this->db->prepare($sql);
        foreach ($bindings as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->execute();
        return $stmt->fetchAll();
    }

    // ─────────────────────────────────────────────────────────────
    // GET /dashboard/kpi
    // Response bentuk yang diharapkan KPICards.jsx:
    // {
    //   beginningStock: { value, prevValue, unit, description },
    //   totalIn:        { value, prevValue, unit, description },
    //   totalOut:       { value, prevValue, unit, description },
    //   endingStock:    { value, prevValue, unit, description },
    //   netGainLoss:    { value, prevValue, unit, description },
    //   avgTemperature: { value, prevValue, unit, description },
    // }
    // ─────────────────────────────────────────────────────────────
    public function getKpi(array $params): array {
        try {
            $wc = $this->buildWhere($params);

            // Total IN = semua kolom _in (tanpa customer yang merupakan aliran OUT)
            $totalInExpr = "perak_supplier_in + refinery_nss_in + fractionation_in + marg_plant_in +
                             filling_plant_in + gbj_in + others_in + transfer_in1 + transfer_in2";

            // Total OUT = semua kolom _out + customer_in (pengiriman ke customer)
            $totalOutExpr = "perak_supplier_out + refinery_nss_out + fractionation_out + marg_plant_out +
                              filling_plant_out + gbj_out + others_out + transfer_out + mat_to_mat_out + customer_in";

            $sql = "SELECT
                        SUM(beginning_stock)         AS beginning,
                        SUM(ending_stock)            AS ending,
                        SUM($totalInExpr)            AS total_in,
                        SUM($totalOutExpr)           AS total_out,
                        SUM(gl_amount)               AS net_gl,
                        AVG(NULLIF(temperature_c, 0)) AS avg_temp
                    FROM oil_transaction" . $wc['where'];

            $rows = $this->execQuery($sql, $wc['bindings']);
            $curr = $rows[0] ?? [];

            // Periode lalu: geser range yang sama ke belakang
            $prevBindings = $this->buildPrevBindings($params, $wc['bindings']);
            $prevWc       = $prevBindings['where'];
            $prevBind     = $prevBindings['bindings'];

            $prevSql = "SELECT
                            SUM(beginning_stock)         AS beginning,
                            SUM(ending_stock)            AS ending,
                            SUM($totalInExpr)            AS total_in,
                            SUM($totalOutExpr)           AS total_out,
                            SUM(gl_amount)               AS net_gl,
                            AVG(NULLIF(temperature_c, 0)) AS avg_temp
                        FROM oil_transaction" . $prevWc;

            $prevRows = $this->execQuery($prevSql, $prevBind);
            $prev = $prevRows[0] ?? [];

            $data = [
                'beginningStock' => [
                    'value'       => $this->f($curr['beginning'] ?? null),
                    'prevValue'   => $this->f($prev['beginning'] ?? null),
                    'unit'        => 'KG',
                    'description' => 'Total stok awal seluruh tangki pada periode terpilih',
                ],
                'totalIn' => [
                    'value'       => $this->f($curr['total_in'] ?? null),
                    'prevValue'   => $this->f($prev['total_in'] ?? null),
                    'unit'        => 'KG',
                    'description' => 'Total volume masuk ke seluruh tangki (Perak-Supplier, Refinery, Transfer, dll.)',
                ],
                'totalOut' => [
                    'value'       => $this->f($curr['total_out'] ?? null),
                    'prevValue'   => $this->f($prev['total_out'] ?? null),
                    'unit'        => 'KG',
                    'description' => 'Total volume keluar dari seluruh tangki',
                ],
                'endingStock' => [
                    'value'       => $this->f($curr['ending'] ?? null),
                    'prevValue'   => $this->f($prev['ending'] ?? null),
                    'unit'        => 'KG',
                    'description' => 'Total stok akhir seluruh tangki pada periode terpilih',
                ],
                'netGainLoss' => [
                    'value'       => $this->f($curr['net_gl'] ?? null),
                    'prevValue'   => $this->f($prev['net_gl'] ?? null),
                    'unit'        => 'KG',
                    'description' => 'Selisih bersih Gain/Loss seluruh tangki. Positif = gain, negatif = loss.',
                ],
                'avgTemperature' => [
                    'value'       => $this->f($curr['avg_temp'] ?? null),
                    'prevValue'   => $this->f($prev['avg_temp'] ?? null),
                    'unit'        => '°C',
                    'description' => 'Rata-rata suhu minyak dari data Control Find',
                ],
            ];

            return ["success" => true, "data" => $data];

        } catch (\PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal mengambil data KPI: " . $e->getMessage()];
        }
    }

    // ─────────────────────────────────────────────────────────────
    // GET /dashboard/daily-trend
    // Response untuk DailyTrendChart:
    // [ { date, IN, OUT, EndingStock }, ... ]
    // ─────────────────────────────────────────────────────────────
    public function getDailyTrend(array $params): array {
        try {
            $wc = $this->buildWhere($params);

            $totalInExpr  = "perak_supplier_in + refinery_nss_in + fractionation_in + marg_plant_in +
                              filling_plant_in + gbj_in + others_in + transfer_in1 + transfer_in2";
            $totalOutExpr = "perak_supplier_out + refinery_nss_out + fractionation_out + marg_plant_out +
                              filling_plant_out + gbj_out + others_out + transfer_out + mat_to_mat_out + customer_in";

            $sql = "SELECT
                        CONVERT(VARCHAR(10), transaction_date, 23) AS date,
                        SUM($totalInExpr)  AS IN_vol,
                        SUM($totalOutExpr) AS OUT_vol,
                        SUM(ending_stock)  AS EndingStock
                    FROM oil_transaction" . $wc['where'] . "
                    GROUP BY transaction_date
                    ORDER BY transaction_date ASC";

            $rows = $this->execQuery($sql, $wc['bindings']);

            $data = array_map(fn($r) => [
                'date'        => $r['date'],
                'IN'          => (float)$r['IN_vol'],
                'OUT'         => (float)$r['OUT_vol'],
                'EndingStock' => (float)$r['EndingStock'],
            ], $rows);

            return ["success" => true, "data" => $data];

        } catch (\PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal mengambil tren harian: " . $e->getMessage()];
        }
    }

    // ─────────────────────────────────────────────────────────────
    // GET /dashboard/gain-loss
    // Response untuk GainLossTrendChart:
    // [ { date, GainLoss, CumulativeGainLoss }, ... ]
    // ─────────────────────────────────────────────────────────────
    public function getGainLoss(array $params): array {
        try {
            $wc = $this->buildWhere($params);

            $sql = "SELECT
                        CONVERT(VARCHAR(10), transaction_date, 23) AS date,
                        SUM(gl_amount) AS GainLoss
                    FROM oil_transaction" . $wc['where'] . "
                    GROUP BY transaction_date
                    ORDER BY transaction_date ASC";

            $rows = $this->execQuery($sql, $wc['bindings']);

            $cumulative = 0.0;
            $data = array_map(function($r) use (&$cumulative) {
                $gl = (float)$r['GainLoss'];
                $cumulative += $gl;
                return [
                    'date'               => $r['date'],
                    'GainLoss'           => $gl,
                    'CumulativeGainLoss' => round($cumulative, 4),
                ];
            }, $rows);

            return ["success" => true, "data" => $data];

        } catch (\PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal mengambil tren gain/loss: " . $e->getMessage()];
        }
    }

    // ─────────────────────────────────────────────────────────────
    // GET /dashboard/stock-distribution
    // Response untuk StockDistributionChart:
    // {
    //   product: [ { name, value }, ... ],
    //   cluster: [ { name, value }, ... ],
    //   tank:    [ { name, value }, ... ]
    // }
    // ─────────────────────────────────────────────────────────────
    public function getStockDistribution(array $params): array {
        try {
            $wc = $this->buildWhere($params);

            // By product
            $byProduct = $this->execQuery(
                "SELECT product_name AS name, SUM(ending_stock) AS value
                 FROM oil_transaction" . $wc['where'] . "
                 GROUP BY product_name ORDER BY value DESC",
                $wc['bindings']
            );

            // By cluster (menggunakan mapping CASE agar C-RM dan TTF/TF ter-cluster dengan benar)
            $clusterCaseSql = "CASE
                WHEN tank LIKE 'C-%' OR tank LIKE 'TC%' THEN 'C'
                WHEN tank LIKE 'TF%' OR tank LIKE 'TTF%' THEN 'F'
                WHEN tank LIKE 'TI%' THEN 'I'
                WHEN tank LIKE 'TP%' THEN 'P'
                WHEN tank LIKE 'TB%' THEN 'B'
                ELSE UPPER(SUBSTRING(tank, 2, 1))
            END";

            $byCluster = $this->execQuery(
                "SELECT $clusterCaseSql AS name, SUM(ending_stock) AS value
                 FROM oil_transaction" . $wc['where'] . "
                 GROUP BY $clusterCaseSql ORDER BY value DESC",
                $wc['bindings']
            );

            // By tank (top 20 supaya chart tidak terlalu ramai)
            $byTank = $this->execQuery(
                "SELECT TOP 20 tank AS name, SUM(ending_stock) AS value
                 FROM oil_transaction" . $wc['where'] . "
                 GROUP BY tank ORDER BY value DESC",
                $wc['bindings']
            );

            $fmt = fn($rows) => array_map(fn($r) => [
                'name'  => $r['name'],
                'value' => (float)$r['value'],
            ], $rows);

            return [
                "success" => true,
                "data"    => [
                    'product' => $fmt($byProduct),
                    'cluster' => array_map(fn($r) => [
                        'name'  => 'Cluster ' . $r['name'],
                        'value' => (float)$r['value'],
                    ], $byCluster),
                    'tank'    => $fmt($byTank),
                ]
            ];

        } catch (\PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal mengambil distribusi stok: " . $e->getMessage()];
        }
    }

    // ─────────────────────────────────────────────────────────────
    // GET /dashboard/transaction-by-unit
    // Response untuk TransactionByUnitChart:
    // {
    //   unit:    [ { name, IN, OUT, count }, ... ],  <- 10 Unit Kerja / Aliran
    //   cluster: [ { name, IN, OUT, count }, ... ],
    //   tank:    [ { name, IN, OUT, count }, ... ]
    // }
    // ─────────────────────────────────────────────────────────────
    public function getTransactionByUnit(array $params): array {
        try {
            $wc = $this->buildWhere($params);

            // 1. By Unit Kerja (10 Grup Aliran: Perak-Supplier, Refinery-NSS, Fractionation, Marg Plant, Filling Plant, GBJ, Others, Transfer, Mat To Mat, Customer)
            $unitSql = "SELECT
                SUM(perak_supplier_in) AS perak_in, SUM(perak_supplier_out) AS perak_out,
                SUM(CASE WHEN perak_supplier_in > 0 OR perak_supplier_out > 0 THEN 1 ELSE 0 END) AS perak_cnt,

                SUM(refinery_nss_in) AS ref_in, SUM(refinery_nss_out) AS ref_out,
                SUM(CASE WHEN refinery_nss_in > 0 OR refinery_nss_out > 0 THEN 1 ELSE 0 END) AS ref_cnt,

                SUM(fractionation_in) AS frac_in, SUM(fractionation_out) AS frac_out,
                SUM(CASE WHEN fractionation_in > 0 OR fractionation_out > 0 THEN 1 ELSE 0 END) AS frac_cnt,

                SUM(marg_plant_in) AS marg_in, SUM(marg_plant_out) AS marg_out,
                SUM(CASE WHEN marg_plant_in > 0 OR marg_plant_out > 0 THEN 1 ELSE 0 END) AS marg_cnt,

                SUM(filling_plant_in) AS fill_in, SUM(filling_plant_out) AS fill_out,
                SUM(CASE WHEN filling_plant_in > 0 OR filling_plant_out > 0 THEN 1 ELSE 0 END) AS fill_cnt,

                SUM(gbj_in) AS gbj_in, SUM(gbj_out) AS gbj_out,
                SUM(CASE WHEN gbj_in > 0 OR gbj_out > 0 THEN 1 ELSE 0 END) AS gbj_cnt,

                SUM(others_in) AS oth_in, SUM(others_out) AS oth_out,
                SUM(CASE WHEN others_in > 0 OR others_out > 0 THEN 1 ELSE 0 END) AS oth_cnt,

                SUM(CASE WHEN transfer_in1 > 0 THEN transfer_in1 ELSE 0 END + CASE WHEN transfer_in2 > 0 THEN transfer_in2 ELSE 0 END) AS trf_in,
                SUM(CASE WHEN transfer_in1 < 0 THEN ABS(transfer_in1) ELSE 0 END + CASE WHEN transfer_in2 < 0 THEN ABS(transfer_in2) ELSE 0 END + ABS(transfer_out)) AS trf_out,
                SUM(CASE WHEN transfer_in1 != 0 OR transfer_in2 != 0 OR transfer_out != 0 THEN 1 ELSE 0 END) AS trf_cnt,

                0 AS m2m_in, SUM(mat_to_mat_out) AS m2m_out,
                SUM(CASE WHEN mat_to_mat_out > 0 THEN 1 ELSE 0 END) AS m2m_cnt,

                0 AS cust_in, SUM(customer_in) AS cust_out,
                SUM(CASE WHEN customer_in > 0 THEN 1 ELSE 0 END) AS cust_cnt
            FROM oil_transaction" . $wc['where'];

            $unitRows = $this->execQuery($unitSql, $wc['bindings']);
            $u = $unitRows[0] ?? [];

            $byUnit = [
                ['name' => 'Perak-Supplier', 'IN' => abs((float)($u['perak_in'] ?? 0)), 'OUT' => abs((float)($u['perak_out'] ?? 0)), 'count' => (int)($u['perak_cnt'] ?? 0)],
                ['name' => 'Refinery-NSS',   'IN' => abs((float)($u['ref_in'] ?? 0)),   'OUT' => abs((float)($u['ref_out'] ?? 0)),   'count' => (int)($u['ref_cnt'] ?? 0)],
                ['name' => 'Fractionation',  'IN' => abs((float)($u['frac_in'] ?? 0)),  'OUT' => abs((float)($u['frac_out'] ?? 0)),  'count' => (int)($u['frac_cnt'] ?? 0)],
                ['name' => 'Marg Plant',     'IN' => abs((float)($u['marg_in'] ?? 0)),  'OUT' => abs((float)($u['marg_out'] ?? 0)),  'count' => (int)($u['marg_cnt'] ?? 0)],
                ['name' => 'Filling Plant',  'IN' => abs((float)($u['fill_in'] ?? 0)),  'OUT' => abs((float)($u['fill_out'] ?? 0)),  'count' => (int)($u['fill_cnt'] ?? 0)],
                ['name' => 'GBJ',            'IN' => abs((float)($u['gbj_in'] ?? 0)),   'OUT' => abs((float)($u['gbj_out'] ?? 0)),   'count' => (int)($u['gbj_cnt'] ?? 0)],
                ['name' => 'Others',         'IN' => abs((float)($u['oth_in'] ?? 0)),   'OUT' => abs((float)($u['oth_out'] ?? 0)),   'count' => (int)($u['oth_cnt'] ?? 0)],
                ['name' => 'Transfer',       'IN' => abs((float)($u['trf_in'] ?? 0)),   'OUT' => abs((float)($u['trf_out'] ?? 0)),   'count' => (int)($u['trf_cnt'] ?? 0)],
                ['name' => 'Mat To Mat',     'IN' => abs((float)($u['m2m_in'] ?? 0)),   'OUT' => abs((float)($u['m2m_out'] ?? 0)),   'count' => (int)($u['m2m_cnt'] ?? 0)],
                ['name' => 'Customer',       'IN' => abs((float)($u['cust_in'] ?? 0)),  'OUT' => abs((float)($u['cust_out'] ?? 0)),  'count' => (int)($u['cust_cnt'] ?? 0)],
            ];

            // 2. By cluster
            $totalInExpr  = "perak_supplier_in + refinery_nss_in + fractionation_in + marg_plant_in +
                              filling_plant_in + gbj_in + others_in + transfer_in1 + transfer_in2";
            $totalOutExpr = "perak_supplier_out + refinery_nss_out + fractionation_out + marg_plant_out +
                              filling_plant_out + gbj_out + others_out + transfer_out + mat_to_mat_out + customer_in";

            $clusterCaseSql = "CASE
                WHEN tank LIKE 'C-%' OR tank LIKE 'TC%' THEN 'C'
                WHEN tank LIKE 'TF%' OR tank LIKE 'TTF%' THEN 'F'
                WHEN tank LIKE 'TI%' THEN 'I'
                WHEN tank LIKE 'TP%' THEN 'P'
                WHEN tank LIKE 'TB%' THEN 'B'
                ELSE UPPER(SUBSTRING(tank, 2, 1))
            END";

            $byCluster = $this->execQuery(
                "SELECT $clusterCaseSql AS name,
                        SUM($totalInExpr) AS IN_vol, SUM($totalOutExpr) AS OUT_vol, COUNT(*) AS cnt
                 FROM oil_transaction" . $wc['where'] . "
                 GROUP BY $clusterCaseSql ORDER BY IN_vol DESC",
                $wc['bindings']
            );

            // 3. By tank (top 20)
            $byTank = $this->execQuery(
                "SELECT TOP 20 tank AS name,
                        SUM($totalInExpr) AS IN_vol, SUM($totalOutExpr) AS OUT_vol, COUNT(*) AS cnt
                 FROM oil_transaction" . $wc['where'] . "
                 GROUP BY tank ORDER BY IN_vol DESC",
                $wc['bindings']
            );

            $fmt = fn($rows) => array_map(fn($r) => [
                'name'  => $r['name'],
                'IN'    => abs((float)$r['IN_vol']),
                'OUT'   => abs((float)$r['OUT_vol']),
                'count' => (int)$r['cnt'],
            ], $rows);

            return [
                "success" => true,
                "data"    => [
                    'unit'    => $byUnit,
                    'cluster' => array_map(fn($r) => [
                        'name'  => 'Cluster ' . $r['name'],
                        'IN'    => abs((float)$r['IN_vol']),
                        'OUT'   => abs((float)$r['OUT_vol']),
                        'count' => (int)$r['cnt'],
                    ], $byCluster),
                    'tank'    => $fmt($byTank),
                ]
            ];

        } catch (\PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal mengambil data per unit: " . $e->getMessage()];
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────
    private function f($val): ?float {
        return ($val === null || $val === '') ? null : (float)$val;
    }

    /**
     * Hitung bindings periode lalu berdasarkan selisih range dateFrom–dateTo.
     * Kalau tidak ada tanggal, kembalikan WHERE kosong (tidak ada periode lalu).
     */
    private function buildPrevBindings(array $params, array $currBindings): array {
        if (empty($params['dateFrom']) || empty($params['dateTo'])) {
            return ['where' => '', 'bindings' => []];
        }

        $from = new \DateTime($params['dateFrom']);
        $to   = new \DateTime($params['dateTo']);
        $diff = $from->diff($to)->days + 1; // panjang periode dalam hari

        $prevTo   = (clone $from)->modify('-1 day');
        $prevFrom = (clone $prevTo)->modify("-{$diff} days")->modify('+1 day');

        $bindings = $currBindings;
        unset($bindings[':dateFrom'], $bindings[':dateTo']);
        $bindings[':dateFrom'] = $prevFrom->format('Y-m-d');
        $bindings[':dateTo']   = $prevTo->format('Y-m-d');

        $conditions = ["transaction_date >= :dateFrom", "transaction_date <= :dateTo"];
        if (!empty($params['product'])) {
            $conditions[] = "product_name = :product";
        }
        if (!empty($params['cluster'])) {
            $conditions[] = "SUBSTRING(tank, 2, 1) = :cluster";
        }

        $where = " WHERE " . implode(" AND ", $conditions);
        return ['where' => $where, 'bindings' => $bindings];
    }
}
