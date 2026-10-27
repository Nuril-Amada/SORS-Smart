<?php
/**
 * SORS - Auth Controller
 * Handles: Login & Register dengan BCRYPT password hashing
 */

require_once __DIR__ . '/../config/database.php';

class AuthController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    // POST /auth/register
    // Payload: full_name, username, password, confirm_password
    public function register(array $input): array {
        $fullName       = trim($input['full_name'] ?? '');
        $username       = trim($input['username'] ?? '');
        $password       = trim($input['password'] ?? '');
        $confirmPass    = trim($input['confirm_password'] ?? '');

        // Validasi kelengkapan field
        if (empty($fullName) || empty($username) || empty($password) || empty($confirmPass)) {
            http_response_code(400);
            return ["success" => false, "message" => "Semua field harus diisi: Nama Lengkap, Username, Password, Konfirmasi Password."];
        }

        // Validasi kecocokan password
        if ($password !== $confirmPass) {
            http_response_code(400);
            return ["success" => false, "message" => "Password dan Konfirmasi Password tidak cocok."];
        }

        // Validasi panjang password
        if (strlen($password) < 6) {
            http_response_code(400);
            return ["success" => false, "message" => "Password minimal 6 karakter."];
        }

        try {
            // Cek username sudah dipakai
            $stmt = $this->db->prepare("SELECT id FROM users WHERE username = :username");
            $stmt->bindParam(':username', $username);
            $stmt->execute();
            if ($stmt->rowCount() > 0) {
                http_response_code(400);
                return ["success" => false, "message" => "Username '$username' sudah digunakan. Silakan pilih username lain."];
            }

            // Hash password dengan BCRYPT (cost=8 untuk keseimbangan keamanan & kecepatan)
            $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 8]);

            // Simpan user baru
            $stmt = $this->db->prepare(
                "INSERT INTO users (full_name, username, password_hash, role) VALUES (:full_name, :username, :password_hash, 'user')"
            );
            $stmt->bindParam(':full_name', $fullName);
            $stmt->bindParam(':username', $username);
            $stmt->bindParam(':password_hash', $passwordHash);
            $stmt->execute();

            // Setelah register berhasil -> frontend redirect ke /login
            http_response_code(201);
            return [
                "success" => true,
                "message" => "Registrasi berhasil! Silakan login untuk masuk ke sistem SORS.",
                "data" => ["redirect" => "/login", "username" => $username]
            ];

        } catch (PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal registrasi: " . $e->getMessage()];
        }
    }

    // POST /auth/login
    // Payload: username, password
    public function login(array $input): array {
        $username = trim($input['username'] ?? '');
        $password = trim($input['password'] ?? '');

        if (empty($username) || empty($password)) {
            http_response_code(400);
            return ["success" => false, "message" => "Username dan Password harus diisi."];
        }

        try {
            $stmt = $this->db->prepare(
                "SELECT id, full_name, username, password_hash, role, created_at FROM users WHERE username = :username"
            );
            $stmt->bindParam(':username', $username);
            $stmt->execute();
            $user = $stmt->fetch();

            if (!$user || !password_verify($password, $user['password_hash'])) {
                http_response_code(401);
                return ["success" => false, "message" => "Username atau Password tidak valid."];
            }

            // Auto-rehash jika hash lama menggunakan cost berbeda (migrasi dari cost 10 ke 8)
            $needsRehash = password_needs_rehash($user['password_hash'], PASSWORD_BCRYPT, ['cost' => 8]);
            if ($needsRehash) {
                $newHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 8]);
                $rehashStmt = $this->db->prepare("UPDATE users SET password_hash = :hash WHERE id = :id");
                $rehashStmt->bindValue(':hash', $newHash);
                $rehashStmt->bindValue(':id', $user['id']);
                $rehashStmt->execute();
            }

            unset($user['password_hash']);

            return [
                "success" => true,
                "message" => "Login berhasil!",
                "data" => [
                    "user" => $user,
                    "redirect" => "/dashboard"
                ]
            ];

        } catch (PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal login: " . $e->getMessage()];
        }
    }

    // GET /auth/me?id={id}
    public function me(): array {
        $userId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

        if ($userId <= 0) {
            http_response_code(400);
            return ["success" => false, "message" => "Parameter id tidak valid."];
        }

        try {
            $stmt = $this->db->prepare(
                "SELECT id, full_name, username, role, created_at FROM users WHERE id = :id"
            );
            $stmt->bindParam(':id', $userId);
            $stmt->execute();
            $user = $stmt->fetch();

            if (!$user) {
                http_response_code(404);
                return ["success" => false, "message" => "User tidak ditemukan."];
            }

            return ["success" => true, "message" => "Data user berhasil diambil.", "data" => $user];

        } catch (PDOException $e) {
            http_response_code(500);
            return ["success" => false, "message" => "Gagal mengambil data user: " . $e->getMessage()];
        }
    }
}
