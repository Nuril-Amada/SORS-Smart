<?php
/**
 * SORS - User Controller
 * Handles: Master Data User Management (Admin Dashboard)
 * Endpoints:
 *   GET /users               - List all users
 *   POST /users              - Create new user (default role 'user')
 *   PUT /users/{id}          - Update user (full_name, role)
 *   PUT /users/{id}/password - Update user password
 *   DELETE /users/{id}       - Delete user
 */

require_once __DIR__ . '/../config/database.php';

class UserController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    /**
     * Memastikan user 'admin' dan 'nuril' ada di database.
     * password_hash() hanya dijalankan jika user belum ada,
     * agar tidak ada delay BCRYPT pada setiap request.
     */
    public function ensureDefaultUsers(): void {
        try {
            // 1. Admin (password: 01juli2026, role: admin) — insert jika belum ada
            $stmt = $this->db->prepare("SELECT id FROM users WHERE username = 'admin'");
            $stmt->execute();
            if (!$stmt->fetch()) {
                $adminHash = password_hash('01juli2026', PASSWORD_BCRYPT, ['cost' => 8]);
                $ins = $this->db->prepare(
                    "INSERT INTO users (full_name, username, password_hash, role) VALUES ('Administrator SORS', 'admin', :hash, 'admin')"
                );
                $ins->bindValue(':hash', $adminHash);
                $ins->execute();
            }

            // 2. Nuril (password: nuril_2026, role: user) — insert jika belum ada
            $stmt2 = $this->db->prepare("SELECT id FROM users WHERE username = 'nuril'");
            $stmt2->execute();
            if (!$stmt2->fetch()) {
                $nurilHash = password_hash('nuril_2026', PASSWORD_BCRYPT, ['cost' => 8]);
                $ins2 = $this->db->prepare(
                    "INSERT INTO users (full_name, username, password_hash, role) VALUES ('Nuril', 'nuril', :hash, 'user')"
                );
                $ins2->bindValue(':hash', $nurilHash);
                $ins2->execute();
            }
        } catch (\Exception $e) {
            // Ignore error if table not ready yet
        }
    }


    // GET /users
    public function getAll(): array {
        try {
            $stmt = $this->db->prepare(
                "SELECT id, full_name, username, role, CONVERT(VARCHAR(19), created_at, 120) AS created_at FROM users ORDER BY id ASC"
            );
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "success" => true,
                "message" => "Data user berhasil diambil.",
                "data"    => $rows
            ];
        } catch (\PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal mengambil data user: " . $e->getMessage()];
        }
    }

    // POST /users
    // Payload: full_name, username, password, role (default 'user')
    public function create(array $input): array {
        $fullName = trim($input['full_name'] ?? '');
        $username = trim($input['username'] ?? '');
        $password = trim($input['password'] ?? '');
        $role     = strtolower(trim($input['role'] ?? 'user'));

        if (empty($fullName) || empty($username) || empty($password)) {
            http_response_code(400);
            return ["success" => false, "message" => "Nama Lengkap, Username, dan Password wajib diisi."];
        }

        if (strlen($password) < 6) {
            http_response_code(400);
            return ["success" => false, "message" => "Password minimal 6 karakter."];
        }

        if ($role !== 'admin' && $role !== 'user') {
            $role = 'user'; // Otomatis role = 'user'
        }

        try {
            // Cek duplikasi username
            $stmt = $this->db->prepare("SELECT id FROM users WHERE username = :username");
            $stmt->bindValue(':username', $username);
            $stmt->execute();
            if ($stmt->rowCount() > 0) {
                http_response_code(400);
                return ["success" => false, "message" => "Username '$username' sudah digunakan."];
            }

            $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 8]);


            $ins = $this->db->prepare(
                "INSERT INTO users (full_name, username, password_hash, role) VALUES (:full_name, :username, :password_hash, :role)"
            );
            $ins->bindValue(':full_name', $fullName);
            $ins->bindValue(':username', $username);
            $ins->bindValue(':password_hash', $passwordHash);
            $ins->bindValue(':role', $role);
            $ins->execute();

            $newId = (int)$this->db->lastInsertId();

            http_response_code(201);
            return [
                "success" => true,
                "message" => "User baru '$username' berhasil ditambahkan dengan role '$role'.",
                "data"    => [
                    "id"        => $newId,
                    "full_name" => $fullName,
                    "username"  => $username,
                    "role"      => $role
                ]
            ];
        } catch (\PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal menambahkan user: " . $e->getMessage()];
        }
    }

    // PUT /users/{id}
    // Payload: full_name, role
    public function update(int $id, array $input): array {
        if ($id <= 0) {
            http_response_code(400);
            return ["success" => false, "message" => "ID user tidak valid."];
        }

        $fullName = trim($input['full_name'] ?? '');
        $role     = strtolower(trim($input['role'] ?? 'user'));

        if ($role !== 'admin' && $role !== 'user') {
            $role = 'user';
        }

        try {
            $stmt = $this->db->prepare("SELECT id FROM users WHERE id = :id");
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            if (!$stmt->fetch()) {
                http_response_code(404);
                return ["success" => false, "message" => "User tidak ditemukan."];
            }

            $sql = "UPDATE users SET role = :role";
            $params = [':role' => $role, ':id' => $id];

            if (!empty($fullName)) {
                $sql .= ", full_name = :full_name";
                $params[':full_name'] = $fullName;
            }

            $sql .= " WHERE id = :id";

            $upd = $this->db->prepare($sql);
            foreach ($params as $k => $v) {
                $upd->bindValue($k, $v);
            }
            $upd->execute();

            return [
                "success" => true,
                "message" => "Role & data user berhasil diperbarui."
            ];
        } catch (\PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal memperbarui user: " . $e->getMessage()];
        }
    }

    // PUT /users/{id}/password
    // Payload: password
    public function updatePassword(int $id, array $input): array {
        if ($id <= 0) {
            http_response_code(400);
            return ["success" => false, "message" => "ID user tidak valid."];
        }

        $password = trim($input['password'] ?? '');

        if (empty($password) || strlen($password) < 6) {
            http_response_code(400);
            return ["success" => false, "message" => "Password baru minimal 6 karakter."];
        }

        try {
            $stmt = $this->db->prepare("SELECT id FROM users WHERE id = :id");
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            if (!$stmt->fetch()) {
                http_response_code(404);
                return ["success" => false, "message" => "User tidak ditemukan."];
            }

            $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 8]);

            $upd = $this->db->prepare("UPDATE users SET password_hash = :hash WHERE id = :id");
            $upd->bindValue(':hash', $passwordHash);
            $upd->bindValue(':id', $id, PDO::PARAM_INT);
            $upd->execute();

            return [
                "success" => true,
                "message" => "Password user berhasil diubah."
            ];
        } catch (\PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal mengubah password: " . $e->getMessage()];
        }
    }

    // DELETE /users/{id}
    public function delete(int $id): array {
        if ($id <= 0) {
            http_response_code(400);
            return ["success" => false, "message" => "ID user tidak valid."];
        }

        try {
            $stmt = $this->db->prepare("DELETE FROM users WHERE id = :id");
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                return ["success" => false, "message" => "User tidak ditemukan."];
            }

            return [
                "success" => true,
                "message" => "User berhasil dihapus."
            ];
        } catch (\PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal menghapus user: " . $e->getMessage()];
        }
    }
}
