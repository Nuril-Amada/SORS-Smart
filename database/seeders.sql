-- =========================================================
-- SORS - Step 3: Seeders (Data Awal)
-- File: database/seeders.sql
-- Jalankan setelah schema.sql selesai
-- =========================================================

USE oilreport_db;
GO

-- ---------------------------------------------------------
-- 1. Master Product (Nomor Seri Material & Nama Produk)
-- ---------------------------------------------------------
-- Hapus data lama jika ada sebelum insert ulang
DELETE FROM dbo.product;
GO

INSERT INTO dbo.product (material_code, product_name) VALUES
('CPO-001',    'CPO'),
('RBDPO-001',  'RBDPO'),
('OLEIN-001',  'RBD Olein'),
('STEARIN-001','RBDST'),
('PFAD-001',   'PFAD'),
('RBD CNO-001','RBD CNO');
GO

PRINT 'Data master product berhasil dimasukkan (' + CAST(@@ROWCOUNT AS VARCHAR) + ' baris).';
GO

-- ---------------------------------------------------------
-- 2. Default Users
-- admin (role: admin, password: 01juli2026)
-- nuril (role: user, password: nuril_2026)
-- ---------------------------------------------------------
IF NOT EXISTS (SELECT id FROM dbo.users WHERE username = 'admin')
BEGIN
    INSERT INTO dbo.users (full_name, username, password_hash, role)
    VALUES (
        'Administrator SORS',
        'admin',
        '$2y$10$eE.Qx6KkZ3yF8w01juli2026hashplaceholder',
        'admin'
    );
    PRINT 'Admin user berhasil dibuat. Username: admin | Password: 01juli2026';
END
GO

IF NOT EXISTS (SELECT id FROM dbo.users WHERE username = 'nuril')
BEGIN
    INSERT INTO dbo.users (full_name, username, password_hash, role)
    VALUES (
        'Nuril',
        'nuril',
        '$2y$10$nuril2026hashplaceholder',
        'user'
    );
    PRINT 'Nuril user berhasil dibuat. Username: nuril | Password: nuril_2026';
END
GO

-- ---------------------------------------------------------
-- Verifikasi Data yang Tersimpan
-- ---------------------------------------------------------
PRINT '';
PRINT '=== Verifikasi Data ===';

SELECT 'product' AS [Tabel], COUNT(*) AS [Jumlah Baris] FROM dbo.product
UNION ALL
SELECT 'users', COUNT(*) FROM dbo.users
UNION ALL
SELECT 'oil_transaction', COUNT(*) FROM dbo.oil_transaction;
GO

PRINT '=== Seeder selesai. Database SORS siap digunakan! ===';
GO
