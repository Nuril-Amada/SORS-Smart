<?php
// PHP Native Front Controller & Router for Apache 2.4
// SORS - Smart Oil Report System

// ---- Konfigurasi Timezone & Error Log PHP ----
date_default_timezone_set('Asia/Jakarta');
ini_set('log_errors', 'On');
ini_set('error_log', 'C:/Apache24/logs/php_error.log');
ini_set('display_errors', 'Off');

// ---- Logger Request SORS ----
function sors_log(string $level, string $message): void {
    $timestamp = date('Y-m-d H:i:s');
    $line = "[$timestamp][$level] $message" . PHP_EOL;
    file_put_contents('C:/Apache24/logs/sors_api.log', $line, FILE_APPEND | LOCK_EX);
}

// ---- Set CORS Headers ----
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ---- Require All Controllers ----
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/UserController.php';
require_once __DIR__ . '/controllers/ProductController.php';
require_once __DIR__ . '/controllers/TransactionController.php';
require_once __DIR__ . '/controllers/DashboardController.php';
require_once __DIR__ . '/controllers/ImportController.php';
require_once __DIR__ . '/controllers/ExportController.php';
require_once __DIR__ . '/controllers/DeleteController.php';



// ---- Parse Request URI ----
$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Remove query string
if (($pos = strpos($requestUri, '?')) !== false) {
    $requestUri = substr($requestUri, 0, $pos);
}

// Strip base prefix (e.g. /oilreport/backend or /backend)
$path = rtrim($requestUri, '/');
if (empty($path)) {
    $path = '/';
}

$basePaths = ['/oilreport/backend', '/backend'];
foreach ($basePaths as $base) {
    if (strpos($path, $base) === 0) {
        $path = substr($path, strlen($base));
        break;
    }
}
$path = '/' . ltrim($path, '/');

// ---- Parse JSON Body for POST/PUT/PATCH/DELETE ----
$inputBody = [];
$rawInput = file_get_contents('php://input');
if (!empty($rawInput)) {
    $jsonDecoded = json_decode($rawInput, true);
    if (is_array($jsonDecoded)) {
        $inputBody = $jsonDecoded;
    }
}

// ---- Root Route ----
if ($path === '/' || $path === '') {
    header("Content-Type: application/json");
    echo json_encode([
        "application" => "SORS API (Smart Oil Report System)",
        "status" => "Running",
        "version" => "1.0.0",
        "timestamp" => date('Y-m-d H:i:s')
    ]);
    exit;
}

// ---- Helper: match dynamic route segments e.g. /products/{id} ----
function matchRoute(string $pattern, string $path, &$matches): bool {
    $regex = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '([^/]+)', $pattern);
    $regex = '#^' . $regex . '$#';
    return (bool)preg_match($regex, $path, $matches);
}

// ---- Router Logic ----
$response = null;
$isCustomOutput = false;

try {

    // -------------------------------------------------------------
    // SWAGGER DOCS
    // -------------------------------------------------------------
    if ($path === '/docs' || $path === '/docs/' || $path === '/docs/index.html') {
        header("Content-Type: text/html; charset=utf-8");
        readfile(__DIR__ . '/docs/index.html');
        exit;

    } elseif ($path === '/docs/openapi.json') {
        header("Content-Type: application/json; charset=utf-8");
        readfile(__DIR__ . '/docs/openapi.json');
        exit;

    // -------------------------------------------------------------
    // AUTH
    // -------------------------------------------------------------
    } elseif (($path === '/auth/login' || $path === '/auth/login/') && $method === 'POST') {
        $controller = new AuthController();
        $response = $controller->login($inputBody);

    } elseif (($path === '/auth/register' || $path === '/auth/register/') && $method === 'POST') {
        $controller = new AuthController();
        $response = $controller->register($inputBody);

    } elseif (($path === '/auth/me' || $path === '/auth/me/') && $method === 'GET') {
        $controller = new AuthController();
        $response = $controller->me();

    // -------------------------------------------------------------
    // USERS (Master Data User Management)
    // -------------------------------------------------------------
    } elseif (($path === '/users' || $path === '/users/') && $method === 'GET') {
        $userCtrl = new UserController();
        $response = $userCtrl->getAll();

    } elseif (($path === '/users' || $path === '/users/') && $method === 'POST') {
        $userCtrl = new UserController();
        $response = $userCtrl->create($inputBody);

    } elseif (matchRoute('/users/{id}/password', $path, $m) && $method === 'PUT') {
        $userCtrl = new UserController();
        $response = $userCtrl->updatePassword((int)$m[1], $inputBody);

    } elseif (matchRoute('/users/{id}', $path, $m) && $method === 'PUT') {
        $userCtrl = new UserController();
        $response = $userCtrl->update((int)$m[1], $inputBody);

    } elseif (matchRoute('/users/{id}', $path, $m) && $method === 'DELETE') {
        $userCtrl = new UserController();
        $response = $userCtrl->delete((int)$m[1]);

    // -------------------------------------------------------------
    // PRODUCTS (Master Material & Nomor Seri Produk)
    // -------------------------------------------------------------
    } elseif (($path === '/products/names' || $path === '/products/names/') && $method === 'GET') {
        $controller = new ProductController();
        $response = $controller->getNames();

    } elseif (($path === '/products' || $path === '/products/') && $method === 'GET') {
        $controller = new ProductController();
        $response = $controller->getAll();

    } elseif (($path === '/products' || $path === '/products/') && $method === 'POST') {
        $controller = new ProductController();
        $response = $controller->create($inputBody);

    } elseif (matchRoute('/products/{id}', $path, $m) && $method === 'PUT') {
        $controller = new ProductController();
        $response = $controller->update((int)$m[1], $inputBody);

    } elseif (matchRoute('/products/{id}', $path, $m) && $method === 'DELETE') {
        $controller = new ProductController();
        $response = $controller->delete((int)$m[1]);

    // -------------------------------------------------------------
    // TRANSACTIONS (Log Transaksi Neraca Massa Tangki)
    // -------------------------------------------------------------
    } elseif (($path === '/transactions' || $path === '/transactions/') && $method === 'GET') {
        $controller = new TransactionController();
        $response = $controller->getAll($_GET);

    } elseif (matchRoute('/transactions/{id}', $path, $m) && $method === 'GET') {
        $controller = new TransactionController();
        $response = $controller->getById((int)$m[1]);

    } elseif (matchRoute('/transactions/{id}', $path, $m) && $method === 'DELETE') {
        $controller = new TransactionController();
        $response = $controller->delete((int)$m[1]);

    // -------------------------------------------------------------
    // DASHBOARD (Analytics & KPI Summary)
    // -------------------------------------------------------------
    } elseif (($path === '/dashboard/kpi' || $path === '/dashboard/kpi/') && $method === 'GET') {
        $controller = new DashboardController();
        $response = $controller->getKpi($_GET);

    } elseif (($path === '/dashboard/daily-trend' || $path === '/dashboard/daily-trend/') && $method === 'GET') {
        $controller = new DashboardController();
        $response = $controller->getDailyTrend($_GET);

    } elseif (($path === '/dashboard/gain-loss' || $path === '/dashboard/gain-loss/') && $method === 'GET') {
        $controller = new DashboardController();
        $response = $controller->getGainLoss($_GET);

    } elseif (($path === '/dashboard/stock-distribution' || $path === '/dashboard/stock-distribution/') && $method === 'GET') {
        $controller = new DashboardController();
        $response = $controller->getStockDistribution($_GET);

    } elseif (($path === '/dashboard/transaction-by-unit' || $path === '/dashboard/transaction-by-unit/') && $method === 'GET') {
        $controller = new DashboardController();
        $response = $controller->getTransactionByUnit($_GET);

    // -------------------------------------------------------------
    // EXPORT & DELETE DATA
    // -------------------------------------------------------------
    } elseif (($path === '/export/csv' || $path === '/export/csv/') && $method === 'GET') {
        $controller = new ExportController();
        $controller->exportCsv($_GET);
        $isCustomOutput = true;

    } elseif (($path === '/export/pdf-data' || $path === '/export/pdf-data/') && $method === 'GET') {
        $controller = new ExportController();
        $response = $controller->exportPdfData($_GET);

    } elseif (($path === '/data/transactions' || $path === '/data/transactions/') && $method === 'DELETE') {
        $controller = new DeleteController();
        $response = $controller->deleteTransactions($inputBody);

    // -------------------------------------------------------------
    // IMPORT (Excel / CSV Data Transaksi Minyak)
    // -------------------------------------------------------------
    } elseif (($path === '/import/transactions' || $path === '/import/transactions/') && $method === 'POST') {
        $controller = new ImportController();
        $response = $controller->importFile();

    // -------------------------------------------------------------
    // 404 NOT FOUND
    // -------------------------------------------------------------
    } else {
        http_response_code(404);
        $response = ["success" => false, "message" => "Endpoint {$method} {$path} tidak ditemukan."];
        sors_log("WARN", "$method $path -> 404 Not Found");
    }

} catch (Exception $e) {
    http_response_code(500);
    $response = ["success" => false, "message" => "Internal Server Error: " . $e->getMessage()];
    sors_log("ERROR", "$method $path -> 500: " . $e->getMessage());
}

if (!$isCustomOutput && $response !== null) {
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $code = http_response_code();
    sors_log("INFO", "$method $path -> $code");
}
