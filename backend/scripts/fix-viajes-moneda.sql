-- Script para arreglar la tabla viajes en Railway
-- Ejecutar esto MANUALMENTE en la BD de Railway

USE truck_manager;

-- 1. Verificar y agregar columnas si no existen
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA='truck_manager' AND TABLE_NAME='viajes' AND COLUMN_NAME='valor_viaje_uyu');

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE viajes ADD COLUMN valor_viaje_uyu DECIMAL(12,2) NOT NULL DEFAULT 0.00',
  'SELECT 1');
  
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Agregar columna moneda si no existe
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA='truck_manager' AND TABLE_NAME='viajes' AND COLUMN_NAME='moneda');

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE viajes ADD COLUMN moneda VARCHAR(3) NOT NULL DEFAULT "UYU"',
  'SELECT 1');
  
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Agregar columna cotizacion si no existe
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA='truck_manager' AND TABLE_NAME='viajes' AND COLUMN_NAME='cotizacion_usd_uyu');

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE viajes ADD COLUMN cotizacion_usd_uyu DECIMAL(10,4) NULL',
  'SELECT 1');
  
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Copiar valores de valorViaje a valorViajeUyu para registros antiguos (si están vacíos)
UPDATE viajes 
SET valor_viaje_uyu = COALESCE(valor_viaje_uyu, 0)
WHERE valor_viaje_uyu = 0 OR valor_viaje_uyu IS NULL;

-- Si valor_viaje_uyu está en 0 pero valor_viaje tiene datos, copiar:
UPDATE viajes 
SET valor_viaje_uyu = valor_viaje
WHERE valor_viaje_uyu = 0 AND valor_viaje > 0;

-- Verificar el resultado
SELECT 
  COUNT(*) as total_viajes,
  COUNT(CASE WHEN valor_viaje > 0 THEN 1 END) as viajes_con_valor,
  COUNT(CASE WHEN valor_viaje_uyu > 0 THEN 1 END) as viajes_con_valor_uyu,
  MIN(valor_viaje) as min_valor,
  MAX(valor_viaje) as max_valor,
  MIN(valor_viaje_uyu) as min_valor_uyu,
  MAX(valor_viaje_uyu) as max_valor_uyu
FROM viajes;
