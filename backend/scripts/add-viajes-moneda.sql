SET @db_name = DATABASE();

SET @has_moneda = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'viajes'
    AND COLUMN_NAME = 'moneda'
);

SET @sql = IF(
  @has_moneda = 0,
  'ALTER TABLE viajes ADD COLUMN moneda VARCHAR(3) NOT NULL DEFAULT ''UYU'' AFTER valorViaje',
  'SELECT ''columna moneda ya existe'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_valor_uyu = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'viajes'
    AND COLUMN_NAME = 'valor_viaje_uyu'
);

SET @sql = IF(
  @has_valor_uyu = 0,
  'ALTER TABLE viajes ADD COLUMN valor_viaje_uyu DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER valorViaje',
  'SELECT ''columna valor_viaje_uyu ya existe'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_cotizacion = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'viajes'
    AND COLUMN_NAME = 'cotizacion_usd_uyu'
);

SET @sql = IF(
  @has_cotizacion = 0,
  'ALTER TABLE viajes ADD COLUMN cotizacion_usd_uyu DECIMAL(10,4) NULL AFTER moneda',
  'SELECT ''columna cotizacion_usd_uyu ya existe'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE viajes
SET moneda = 'UYU'
WHERE moneda IS NULL OR moneda = '' OR moneda = 'PYG';

UPDATE viajes
SET valor_viaje_uyu = valorViaje
WHERE valor_viaje_uyu IS NULL OR valor_viaje_uyu = 0;
