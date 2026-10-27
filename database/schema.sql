-- =========================================================
-- SORS - Step 2: Database Schema (DDL)
-- File: database/schema.sql
-- Jalankan setelah setup_login.sql selesai
-- =========================================================

USE oilreport_db;
GO

-- ---------------------------------------------------------
-- Drop tabel dalam urutan yang benar (FK dulu)
-- oil_transaction referensi ke users, jadi drop duluan
-- ---------------------------------------------------------
IF OBJECT_ID('dbo.oil_transaction', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.oil_transaction;
    PRINT 'Tabel oil_transaction dihapus.';
END
GO

IF OBJECT_ID('dbo.product', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.product;
    PRINT 'Tabel product dihapus.';
END
GO

IF OBJECT_ID('dbo.users', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.users;
    PRINT 'Tabel users dihapus.';
END
GO

-- ---------------------------------------------------------
-- 1. Tabel: users
-- ---------------------------------------------------------
CREATE TABLE dbo.users (
    id            INT           IDENTITY(1,1) PRIMARY KEY,
    full_name     VARCHAR(100)  NOT NULL,
    username      VARCHAR(50)   NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    role          VARCHAR(20)   NOT NULL DEFAULT 'user',
    created_at    DATETIME      NOT NULL DEFAULT GETDATE(),

    CONSTRAINT UQ_users_username UNIQUE (username)
);
GO

PRINT 'Tabel users berhasil dibuat.';
GO

-- ---------------------------------------------------------
-- 2. Tabel: product
-- ---------------------------------------------------------
CREATE TABLE dbo.product (
    id            INT           IDENTITY(1,1) PRIMARY KEY,
    material_code VARCHAR(50)   NOT NULL,    -- Nomor Seri / Material Code
    product_name  VARCHAR(100)  NOT NULL,    -- CPO, RBDPO, RBD Olein, dll.
    created_at    DATETIME      NOT NULL DEFAULT GETDATE(),

    CONSTRAINT UQ_product_material_code UNIQUE (material_code)
);
GO

PRINT 'Tabel product berhasil dibuat.';
GO

-- ---------------------------------------------------------
-- 3. Tabel: oil_transaction
-- ---------------------------------------------------------
CREATE TABLE dbo.oil_transaction (
    id                  INT             IDENTITY(1,1) PRIMARY KEY,
    transaction_date    DATE            NOT NULL,
    tank                VARCHAR(20)     NOT NULL,       -- TC1, TC2, TI1, TP1, TF2, TB1, dst.
    product_tankfarm    VARCHAR(100)    NULL,           -- Spesifikasi rinci produk tangki
    product_name        VARCHAR(100)    NOT NULL,       -- Nama Material / Produk

    -- Stok Awal & Akhir
    beginning_stock     DECIMAL(18,2)   NOT NULL DEFAULT 0.00,
    ending_stock        DECIMAL(18,2)   NOT NULL DEFAULT 0.00,

    -- Pergerakan: Perak-Supplier
    perak_supplier_in   DECIMAL(18,2)   NOT NULL DEFAULT 0.00,
    perak_supplier_out  DECIMAL(18,2)   NOT NULL DEFAULT 0.00,

    -- Pergerakan: Refinery-NSS
    refinery_nss_in     DECIMAL(18,2)   NOT NULL DEFAULT 0.00,
    refinery_nss_out    DECIMAL(18,2)   NOT NULL DEFAULT 0.00,

    -- Pergerakan: Fractionation
    fractionation_in    DECIMAL(18,2)   NOT NULL DEFAULT 0.00,
    fractionation_out   DECIMAL(18,2)   NOT NULL DEFAULT 0.00,

    -- Pergerakan: Marg Plant
    marg_plant_in       DECIMAL(18,2)   NOT NULL DEFAULT 0.00,
    marg_plant_out      DECIMAL(18,2)   NOT NULL DEFAULT 0.00,

    -- Pergerakan: Filling Plant
    filling_plant_in    DECIMAL(18,2)   NOT NULL DEFAULT 0.00,
    filling_plant_out   DECIMAL(18,2)   NOT NULL DEFAULT 0.00,

    -- Pergerakan: GBJ (Gudang Barang Jadi)
    gbj_in              DECIMAL(18,2)   NOT NULL DEFAULT 0.00,
    gbj_out             DECIMAL(18,2)   NOT NULL DEFAULT 0.00,

    -- Pergerakan: Others
    others_in           DECIMAL(18,2)   NOT NULL DEFAULT 0.00,
    others_out          DECIMAL(18,2)   NOT NULL DEFAULT 0.00,

    -- Pergerakan: Transfer Internal
    transfer_in1        DECIMAL(18,2)   NOT NULL DEFAULT 0.00,
    transfer_in2        DECIMAL(18,2)   NOT NULL DEFAULT 0.00,
    transfer_out        DECIMAL(18,2)   NOT NULL DEFAULT 0.00,

    -- Pergerakan: Mat To Mat
    mat_to_mat_out      DECIMAL(18,2)   NOT NULL DEFAULT 0.00,

    -- Pergerakan: Customer
    customer_in         DECIMAL(18,2)   NOT NULL DEFAULT 0.00,

    -- Variansi Gain / Loss
    gl_amount           DECIMAL(18,2)   NOT NULL DEFAULT 0.00,   -- Jumlah selisih (Kg)
    gl_percentage       DECIMAL(8,4)    NOT NULL DEFAULT 0.0000, -- Persen selisih G-L (%)
    over_threshold      VARCHAR(10)     NOT NULL DEFAULT '',     -- 'Yes' jika |G-L%| > 0.2%
    cause_analysis      NVARCHAR(MAX)   NULL,                   -- Analisa Penyebab

    -- Control Find (Pengukuran Fisik Tangki)
    sounding_cm         DECIMAL(10,2)   NULL DEFAULT 0.00,       -- Tinggi sounding (Cm)
    delta_cm            DECIMAL(10,2)   NULL DEFAULT 0.00,       -- Perubahan sounding (ΔCm)
    temperature_c       DECIMAL(8,2)    NULL DEFAULT 0.00,       -- Temperatur minyak (°C)
    delta_temperature_c DECIMAL(8,2)    NULL DEFAULT 0.00,       -- Perubahan temperatur (Δ°C)

    -- Audit
    imported_at         DATETIME        NOT NULL DEFAULT GETDATE()
);
GO

PRINT 'Tabel oil_transaction berhasil dibuat.';
GO

-- ---------------------------------------------------------
-- Index untuk performa query
-- ---------------------------------------------------------
CREATE INDEX IX_oil_trans_date    ON dbo.oil_transaction (transaction_date);
CREATE INDEX IX_oil_trans_tank    ON dbo.oil_transaction (tank);
CREATE INDEX IX_oil_trans_product ON dbo.oil_transaction (product_name);
CREATE INDEX IX_oil_trans_flag    ON dbo.oil_transaction (over_threshold);
GO

PRINT '=== Schema selesai. Jalankan seeders.sql selanjutnya. ===';
GO
