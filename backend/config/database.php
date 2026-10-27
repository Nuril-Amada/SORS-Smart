<?php
/**
 * SORS (Smart Oil Report System) - Database Configuration
 * File: backend/config/database.php
 * Description: PDO Connection helper for MS SQL Server with automatic .env loader
 */

// Helper membaca file .env secara native tanpa dependensi tambahan
if (!function_exists('loadSorsEnv')) {
    function loadSorsEnv($envPath) {
        if (!file_exists($envPath)) return;
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || strpos($line, '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($name, $value) = explode('=', $line, 2);
                $name  = trim($name);
                $value = trim($value);
                $value = trim($value, '"\'');
                if (!empty($name)) {
                    putenv("{$name}={$value}");
                    $_ENV[$name] = $value;
                    $_SERVER[$name] = $value;
                }
            }
        }
    }
}

// Otomatis load .env dari direktori backend
loadSorsEnv(__DIR__ . '/../.env');

class Database {
    private $host = "localhost";
    private $db_name = "oilreport_db";
    private $username = "sors_user";
    private $password = "sors_2026";
    private $port = "1433";
    private $conn = null;

    public function __construct() {
        if (getenv('DB_HOST')) $this->host = getenv('DB_HOST');
        if (getenv('DB_NAME')) $this->db_name = getenv('DB_NAME');
        if (getenv('DB_USER')) $this->username = getenv('DB_USER');
        if (getenv('DB_PASS')) $this->password = getenv('DB_PASS');
        if (getenv('DB_PORT')) $this->port = getenv('DB_PORT');
    }

    public function getConnection() {
        $this->conn = null;

        try {
            // Attempt 1: SQL Server PDO driver (sqlsrv)
            if (in_array("sqlsrv", PDO::getAvailableDrivers())) {
                $dsn = "sqlsrv:Server={$this->host};Database={$this->db_name};TrustServerCertificate=true";
                $this->conn = new PDO($dsn, $this->username, $this->password);
            }
            // Attempt 2: ODBC Driver for SQL Server (Windows standard)
            elseif (in_array("odbc", PDO::getAvailableDrivers())) {
                $odbcDrivers = [
                    "ODBC Driver 17 for SQL Server",
                    "ODBC Driver 18 for SQL Server",
                    "SQL Server"
                ];
                $lastException = null;
                foreach ($odbcDrivers as $odbcDriver) {
                    try {
                        $dsn = "odbc:Driver={$odbcDriver};Server={$this->host};Database={$this->db_name};TrustServerCertificate=yes;";
                        $this->conn = new PDO($dsn, $this->username, $this->password, [
                            PDO::ATTR_TIMEOUT => 3
                        ]);
                        if ($this->conn) break;
                    } catch (PDOException $ex) {
                        $lastException = $ex;
                    }
                }
                if (!$this->conn && $lastException) {
                    throw $lastException;
                }
            }
            // Attempt 3: DBLIB / FreeTDS driver (Linux fallback)
            elseif (in_array("dblib", PDO::getAvailableDrivers())) {
                $dsn = "dblib:host={$this->host}:{$this->port};dbname={$this->db_name}";
                $this->conn = new PDO($dsn, $this->username, $this->password);
            }
            // Fallback: MySQL PDO
            elseif (in_array("mysql", PDO::getAvailableDrivers())) {
                $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset=utf8mb4";
                $this->conn = new PDO($dsn, $this->username, $this->password);
            }
            // Fallback: SQLite
            elseif (in_array("sqlite", PDO::getAvailableDrivers())) {
                $sqlitePath = __DIR__ . '/../../database/oilreport.sqlite';
                $dsn = "sqlite:" . $sqlitePath;
                $this->conn = new PDO($dsn);
            }
            else {
                throw new Exception("Tidak ada driver PDO database SQL Server yang tersedia.");
            }

            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        } catch (PDOException $exception) {
            http_response_code(500);
            header("Content-Type: application/json; charset=UTF-8");
            echo json_encode([
                "success" => false,
                "message" => "Gagal terhubung ke database SQL Server: " . $exception->getMessage(),
                "error_code" => $exception->getCode()
            ]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            header("Content-Type: application/json; charset=UTF-8");
            echo json_encode([
                "success" => false,
                "message" => $e->getMessage()
            ]);
            exit;
        }

        return $this->conn;
    }
}
