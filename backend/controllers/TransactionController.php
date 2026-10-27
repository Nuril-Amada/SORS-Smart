<?php
/**
 * SORS - Transaction Controller
 * Handles: Query, Filter & Pagination untuk log oil_transaction
 */

require_once __DIR__ . '/../config/database.php';

class TransactionController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    // GET /transactions
    // Query params: page, limit, tank, tankSearch, product, product_name, cluster, dateFrom, start_date, dateTo, end_date, over_threshold
    public function getAll(array $params): array {
        $page       = max(1, (int)($params['page'] ?? 1));
        $limitParam = $params['limit'] ?? null;

        // Jika limitParam 0, '0', 'all', 'unlimited', atau falsy (kecuali jika bernilai > 0), tidak dibatasi (ambil seluruh data periode)
        $isUnlimited = ($limitParam === 0 || $limitParam === '0' || strtolower((string)$limitParam) === 'all' || strtolower((string)$limitParam) === 'unlimited');

        if ($isUnlimited) {
            $limit  = 0;
            $offset = 0;
        } else {
            $limitVal = (int)($limitParam ?? 0);
            $limit    = $limitVal > 0 ? $limitVal : 0;
            $offset   = ($page - 1) * max(1, $limit);
        }

        $conditions = [];
        $bindings   = [];

        $tankQuery = $params['tankSearch'] ?? $params['tank'] ?? '';
        if (!empty($tankQuery)) {
            $conditions[] = "tank LIKE :tank";
            $bindings[':tank'] = '%' . $tankQuery . '%';
        }
        $prodQuery = $params['product'] ?? $params['product_name'] ?? '';
        if (!empty($prodQuery) && $prodQuery !== 'Semua Produk') {
            $conditions[] = "product_name = :product_name";
            $bindings[':product_name'] = $prodQuery;
        }
        if (!empty($params['cluster']) && $params['cluster'] !== 'Semua Cluster') {
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
        $startDate = $params['dateFrom'] ?? $params['start_date'] ?? '';
        if (!empty($startDate)) {
            $conditions[] = "transaction_date >= :start_date";
            $bindings[':start_date'] = $startDate;
        }
        $endDate = $params['dateTo'] ?? $params['end_date'] ?? '';
        if (!empty($endDate)) {
            $conditions[] = "transaction_date <= :end_date";
            $bindings[':end_date'] = $endDate;
        }
        if (isset($params['over_threshold']) && $params['over_threshold'] !== '') {
            if ($params['over_threshold'] === '1' || strtolower($params['over_threshold']) === 'yes') {
                $conditions[] = "over_threshold = 'Yes'";
            } else {
                $conditions[] = "(over_threshold IS NULL OR over_threshold = '' OR over_threshold != 'Yes')";
            }
        }

        $where = !empty($conditions) ? " WHERE " . implode(" AND ", $conditions) : "";

        try {
            // Total count
            $countStmt = $this->db->prepare("SELECT COUNT(*) as total FROM oil_transaction" . $where);
            foreach ($bindings as $key => $val) $countStmt->bindValue($key, $val);
            $countStmt->execute();
            $total = (int)$countStmt->fetch()['total'];

            // Data dengan CTE untuk menghitung selisih suhu (Delta Suhu) H - (H-1) per tangki
            $sql = "WITH RankedTransactions AS (
                        SELECT *,
                            (CASE WHEN temperature_c > 0 THEN (temperature_c - LAG(temperature_c) OVER (PARTITION BY tank ORDER BY transaction_date ASC)) ELSE NULL END) AS computed_delta_temp
                        FROM oil_transaction
                    )
                    SELECT * FROM RankedTransactions{$where}
                    ORDER BY transaction_date DESC, tank ASC";

            if ($limit > 0) {
                $sql .= " OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY";
            }

            $stmt = $this->db->prepare($sql);
            foreach ($bindings as $key => $val) $stmt->bindValue($key, $val);
            if ($limit > 0) {
                $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
                $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            }
            $stmt->execute();

            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $formattedItems = array_map([$this, 'formatItem'], $rows);

            $totalPages    = ($limit > 0) ? (int)ceil($total / $limit) : 1;
            $returnedLimit = ($limit > 0) ? $limit : $total;

            return [
                "success" => true,
                "message" => "Data transaksi berhasil diambil.",
                "data" => [
                    "page"         => $page,
                    "limit"        => $returnedLimit,
                    "total_records"=> $total,
                    "total_pages"  => $totalPages,
                    "items"        => $formattedItems
                ]
            ];

        } catch (PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal mengambil data transaksi: " . $e->getMessage()];
        }
    }

    private function parseFlowPair(float $inVal, float $outVal): array {
        $in = 0.0;
        $out = 0.0;
        if ($inVal > 0) $in += $inVal;
        elseif ($inVal < 0) $out += abs($inVal);

        if ($outVal > 0) $out += $outVal;
        elseif ($outVal < 0) $in += abs($outVal);

        return ['in' => $in, 'out' => $out];
    }

    public function formatItem(array $row): array {
        $rawDelta = $row['delta_temperature_c'] ?? null;
        $compDelta = $row['computed_delta_temp'] ?? null;
        $deltaVal = null;
        if ($rawDelta !== null && (float)$rawDelta != 0) {
            $deltaVal = round((float)$rawDelta, 2);
        } elseif ($compDelta !== null && $compDelta !== '') {
            $deltaVal = round((float)$compDelta, 2);
        }

        $trfIn1 = (float)($row['transfer_in1'] ?? 0);
        $trfIn2 = (float)($row['transfer_in2'] ?? 0);
        $trfOut = (float)($row['transfer_out'] ?? 0);

        $transferIn  = ($trfIn1 > 0 ? $trfIn1 : 0) + ($trfIn2 > 0 ? $trfIn2 : 0) + ($trfOut < 0 ? abs($trfOut) : 0);
        $transferOut = ($trfIn1 < 0 ? abs($trfIn1) : 0) + ($trfIn2 < 0 ? abs($trfIn2) : 0) + ($trfOut > 0 ? $trfOut : 0);

        return [
            'id'                  => (int)$row['id'],
            'date'                => substr((string)($row['transaction_date'] ?? ''), 0, 10),
            'tank'                => $row['tank'] ?? '',
            'productTank'         => $row['product_tankfarm'] ?? '',
            'product'             => $row['product_name'] ?? '',
            'beginning'           => (float)($row['beginning_stock'] ?? 0),
            'ending'              => (float)($row['ending_stock'] ?? 0),
            'flows'               => [
                'perak'         => $this->parseFlowPair((float)($row['perak_supplier_in'] ?? 0), (float)($row['perak_supplier_out'] ?? 0)),
                'refinery'      => $this->parseFlowPair((float)($row['refinery_nss_in'] ?? 0), (float)($row['refinery_nss_out'] ?? 0)),
                'fractionation' => $this->parseFlowPair((float)($row['fractionation_in'] ?? 0), (float)($row['fractionation_out'] ?? 0)),
                'marg'          => $this->parseFlowPair((float)($row['marg_plant_in'] ?? 0), (float)($row['marg_plant_out'] ?? 0)),
                'filling'       => $this->parseFlowPair((float)($row['filling_plant_in'] ?? 0), (float)($row['filling_plant_out'] ?? 0)),
                'gbj'           => $this->parseFlowPair((float)($row['gbj_in'] ?? 0), (float)($row['gbj_out'] ?? 0)),
                'others'        => $this->parseFlowPair((float)($row['others_in'] ?? 0), (float)($row['others_out'] ?? 0)),
                'transfer'      => ['in' => $transferIn, 'out' => $transferOut],
                'matToMat'      => ['in' => 0, 'out' => abs((float)($row['mat_to_mat_out'] ?? 0))],
                'customer'      => ['in' => 0, 'out' => abs((float)($row['customer_in'] ?? 0))],
            ],
            'gl'                  => (float)($row['gl_amount'] ?? 0),
            'glPct'               => (float)($row['gl_percentage'] ?? 0),
            'glFlag'              => strtolower((string)($row['over_threshold'] ?? '')) === 'yes',
            'cause'               => $row['cause_analysis'] ?? '',
            'temp'                => ($row['temperature_c'] !== null && (float)$row['temperature_c'] != 0) ? (float)$row['temperature_c'] : null,
            'deltaTemp'           => $deltaVal,
            'transaction_date'    => $row['transaction_date'] ?? '',
            'product_tankfarm'    => $row['product_tankfarm'] ?? '',
            'product_name'        => $row['product_name'] ?? '',
            'beginning_stock'     => (float)($row['beginning_stock'] ?? 0),
            'ending_stock'        => (float)($row['ending_stock'] ?? 0),
            'gl_amount'           => (float)($row['gl_amount'] ?? 0),
            'gl_percentage'       => (float)($row['gl_percentage'] ?? 0),
            'over_threshold'      => $row['over_threshold'] ?? '',
            'cause_analysis'      => $row['cause_analysis'] ?? '',
            'temperature_c'       => ($row['temperature_c'] !== null && (float)$row['temperature_c'] != 0) ? (float)$row['temperature_c'] : null,
            'delta_temperature_c' => $deltaVal,
        ];
    }

    // GET /transactions/{id}
    public function getById(int $id): array {
        try {
            $stmt = $this->db->prepare("SELECT * FROM oil_transaction WHERE id = :id");
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $item = $stmt->fetch();

            if (!$item) {
                http_response_code(404);
                return ["success" => false, "message" => "Data transaksi tidak ditemukan."];
            }

            return ["success" => true, "message" => "Detail transaksi ditemukan.", "data" => $item];

        } catch (PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal mengambil detail transaksi: " . $e->getMessage()];
        }
    }

    // DELETE /transactions/{id}
    public function delete(int $id): array {
        try {
            $stmt = $this->db->prepare("DELETE FROM oil_transaction WHERE id = :id");
            $stmt->bindParam(':id', $id);
            $stmt->execute();

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                return ["success" => false, "message" => "Data transaksi tidak ditemukan."];
            }

            return ["success" => true, "message" => "Data transaksi berhasil dihapus."];

        } catch (PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal menghapus transaksi: " . $e->getMessage()];
        }
    }
}
