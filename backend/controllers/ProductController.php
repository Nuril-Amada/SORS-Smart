<?php
/**
 * SORS - Product Controller
 * Handles: Master Material & Nomor Seri Produk
 */

require_once __DIR__ . '/../config/database.php';

class ProductController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    // GET /products
    public function getAll(): array {
        try {
            $stmt = $this->db->prepare(
                "SELECT id, material_code, product_name, description, created_at FROM product ORDER BY id ASC"
            );
            $stmt->execute();
            return ["success" => true, "message" => "Data produk berhasil diambil.", "data" => $stmt->fetchAll()];
        } catch (PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal mengambil data produk: " . $e->getMessage()];
        }
    }

    // GET /products/names
    // Mengembalikan daftar nama produk unik (untuk dropdown filter di frontend)
    public function getNames(): array {
        try {
            $stmt = $this->db->prepare(
                "SELECT DISTINCT product_name FROM product WHERE product_name IS NOT NULL AND product_name != '' ORDER BY product_name ASC"
            );
            $stmt->execute();
            $names = $stmt->fetchAll(\PDO::FETCH_COLUMN);
            return ["success" => true, "data" => $names];
        } catch (PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal mengambil nama produk: " . $e->getMessage()];
        }
    }

    // POST /products
    // Payload: material_code, product_name, description
    public function create(array $input): array {
        $materialCode = trim($input['material_code'] ?? '');
        $productName  = trim($input['product_name'] ?? '');

        if (empty($materialCode) || empty($productName)) {
            http_response_code(400);
            return ["success" => false, "message" => "Nomor Seri Material dan Nama Produk harus diisi."];
        }

        try {
            // Cek duplikat material_code
            $stmt = $this->db->prepare("SELECT id FROM product WHERE material_code = :material_code");
            $stmt->bindParam(':material_code', $materialCode);
            $stmt->execute();
            if ($stmt->rowCount() > 0) {
                http_response_code(400);
                return ["success" => false, "message" => "Nomor Seri Material '$materialCode' sudah terdaftar."];
            }

            $stmt = $this->db->prepare(
                "INSERT INTO product (material_code, product_name) VALUES (:material_code, :product_name)"
            );
            $stmt->bindParam(':material_code', $materialCode);
            $stmt->bindParam(':product_name', $productName);
            $stmt->execute();

            http_response_code(201);
            return [
                "success" => true,
                "message" => "Produk berhasil ditambahkan.",
                "data" => ["material_code" => $materialCode, "product_name" => $productName]
            ];

        } catch (PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal menambahkan produk: " . $e->getMessage()];
        }
    }

    // PUT /products/{id}
    // Payload: material_code, product_name, description
    public function update(int $id, array $input): array {
        $materialCode = trim($input['material_code'] ?? '');
        $productName  = trim($input['product_name'] ?? '');

        if (empty($materialCode) || empty($productName)) {
            http_response_code(400);
            return ["success" => false, "message" => "Nomor Seri Material dan Nama Produk harus diisi."];
        }

        try {
            $stmt = $this->db->prepare(
                "UPDATE product SET material_code = :material_code, product_name = :product_name WHERE id = :id"
            );
            $stmt->bindParam(':material_code', $materialCode);
            $stmt->bindParam(':product_name', $productName);
            $stmt->bindParam(':id', $id);
            $stmt->execute();

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                return ["success" => false, "message" => "Produk tidak ditemukan."];
            }

            return ["success" => true, "message" => "Produk berhasil diperbarui."];

        } catch (PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal memperbarui produk: " . $e->getMessage()];
        }
    }

    // DELETE /products/{id}
    public function delete(int $id): array {
        try {
            $stmt = $this->db->prepare("DELETE FROM product WHERE id = :id");
            $stmt->bindParam(':id', $id);
            $stmt->execute();

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                return ["success" => false, "message" => "Produk tidak ditemukan."];
            }

            return ["success" => true, "message" => "Produk berhasil dihapus."];

        } catch (PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal menghapus produk: " . $e->getMessage()];
        }
    }
}
