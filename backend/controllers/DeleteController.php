<?php
/**
 * SORS - Delete Controller
 * DELETE /data/transactions  - Hapus data transaksi sesuai filter periode (dateFrom, dateTo) + cluster + product
 * Seperti pola Finance: hapus berdasarkan rentang tanggal yang dipilih di FilterBar.
 */

require_once __DIR__ . '/../config/database.php';

class DeleteController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    // DELETE /data/transactions
    // Body JSON: { dateFrom, dateTo, product?, cluster? }
    public function deleteTransactions(array $input): array {
        $dateFrom = trim($input['dateFrom'] ?? '');
        $dateTo   = trim($input['dateTo'] ?? '');
        $product  = trim($input['product'] ?? '');
        $cluster  = trim($input['cluster'] ?? '');

        // dateFrom dan dateTo WAJIB ada (tidak boleh hapus semua tanpa filter)
        if (empty($dateFrom) || empty($dateTo)) {
            http_response_code(400);
            return [
                "success" => false,
                "message" => "Periode tanggal (dateFrom dan dateTo) harus diisi sebelum menghapus data."
            ];
        }

        // Validasi format tanggal
        if (!strtotime($dateFrom) || !strtotime($dateTo)) {
            http_response_code(400);
            return ["success" => false, "message" => "Format tanggal tidak valid. Gunakan format YYYY-MM-DD."];
        }

        if (strtotime($dateFrom) > strtotime($dateTo)) {
            http_response_code(400);
            return ["success" => false, "message" => "Tanggal awal tidak boleh lebih besar dari tanggal akhir."];
        }

        try {
            // Hitung jumlah data yang akan dihapus dulu (konfirmasi)
            $countSql = $this->buildQuery("SELECT COUNT(*) AS total", $dateFrom, $dateTo, $product, $cluster);
            $countStmt = $this->db->prepare($countSql['sql']);
            foreach ($countSql['bindings'] as $k => $v) $countStmt->bindValue($k, $v);
            $countStmt->execute();
            $totalToDelete = (int)$countStmt->fetch()['total'];

            if ($totalToDelete === 0) {
                http_response_code(404);
                return [
                    "success" => false,
                    "message" => "Tidak ada data transaksi pada periode {$dateFrom} s/d {$dateTo} yang sesuai filter."
                ];
            }

            // Eksekusi DELETE
            $delSql = $this->buildQuery("DELETE", $dateFrom, $dateTo, $product, $cluster);
            $delStmt = $this->db->prepare($delSql['sql']);
            foreach ($delSql['bindings'] as $k => $v) $delStmt->bindValue($k, $v);
            $delStmt->execute();

            $deleted = $delStmt->rowCount();

            return [
                "success" => true,
                "message" => "Berhasil menghapus {$deleted} data transaksi pada periode {$dateFrom} s/d {$dateTo}.",
                "data"    => [
                    "deleted_count" => $deleted,
                    "period_from"   => $dateFrom,
                    "period_to"     => $dateTo,
                ]
            ];

        } catch (\PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal menghapus data: " . $e->getMessage()];
        }
    }

    // Helper: build SELECT/DELETE query
    private function buildQuery(string $selectOrDelete, string $dateFrom, string $dateTo, string $product, string $cluster): array {
        $conditions = [
            "transaction_date >= :dateFrom",
            "transaction_date <= :dateTo"
        ];
        $bindings = [
            ':dateFrom' => $dateFrom,
            ':dateTo'   => $dateTo,
        ];

        if (!empty($product)) {
            $conditions[] = "product_name = :product";
            $bindings[':product'] = $product;
        }
        if (!empty($cluster)) {
            $conditions[] = "SUBSTRING(tank, 2, 1) = :cluster";
            $bindings[':cluster'] = strtoupper($cluster);
        }

        $where = " WHERE " . implode(" AND ", $conditions);
        $sql   = "{$selectOrDelete} FROM oil_transaction{$where}";

        return ['sql' => $sql, 'bindings' => $bindings];
    }
}
