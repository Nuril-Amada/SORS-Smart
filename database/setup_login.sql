-- =========================================================
-- SORS - Step 1: Setup SQL Server Login & User
-- File: database/setup_login.sql
-- Jalankan ini sebagai SA atau sysadmin di SSMS
-- =========================================================

USE master;
GO

-- ---------------------------------------------------------
-- 1. Buat Database oilreport_db
-- ---------------------------------------------------------
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'oilreport_db')
BEGIN
    CREATE DATABASE oilreport_db;
    PRINT 'Database oilreport_db berhasil dibuat.';
END
ELSE
BEGIN
    PRINT 'Database oilreport_db sudah ada, dilewati.';
END
GO

-- ---------------------------------------------------------
-- 2. Buat SQL Server Login: sors_user
-- ---------------------------------------------------------
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'sors_user')
BEGIN
    CREATE LOGIN sors_user
        WITH PASSWORD    = 'sors_2026',
             DEFAULT_DATABASE = oilreport_db,
             CHECK_EXPIRATION = OFF,
             CHECK_POLICY     = OFF;
    PRINT 'Login sors_user berhasil dibuat.';
END
ELSE
BEGIN
    PRINT 'Login sors_user sudah ada, dilewati.';
END
GO

-- ---------------------------------------------------------
-- 3. Buat Database User & Mapping ke Login
-- ---------------------------------------------------------
USE oilreport_db;
GO

IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'sors_user')
BEGIN
    CREATE USER sors_user FOR LOGIN sors_user;
    PRINT 'Database user sors_user berhasil dibuat.';
END
ELSE
BEGIN
    PRINT 'Database user sors_user sudah ada, dilewati.';
END
GO

-- ---------------------------------------------------------
-- 4. Beri Hak Akses ke sors_user
-- ---------------------------------------------------------
-- db_datareader  : izin SELECT semua tabel
-- db_datawriter  : izin INSERT, UPDATE, DELETE semua tabel
-- db_ddladmin    : izin CREATE/ALTER/DROP tabel (untuk schema creation)
ALTER ROLE db_datareader ADD MEMBER sors_user;
ALTER ROLE db_datawriter ADD MEMBER sors_user;
ALTER ROLE db_ddladmin   ADD MEMBER sors_user;
GO

-- Berikan izin EXECUTE dan hak khusus yang dibutuhkan
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO sors_user;
GRANT CREATE TABLE TO sors_user;
GO

PRINT '=== Setup sors_user selesai. Jalankan schema.sql selanjutnya. ===';
GO
