-- Agrega soporte para documento de descarga en viajes
-- Compatible con MySQL 8+

SET @db_name = DATABASE();

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE viajes ADD COLUMN documento_descarga TEXT NULL',
    'SELECT "documento_descarga ya existe"'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'viajes'
    AND COLUMN_NAME = 'documento_descarga'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE viajes ADD COLUMN documento_descarga_nombre VARCHAR(255) NULL',
    'SELECT "documento_descarga_nombre ya existe"'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'viajes'
    AND COLUMN_NAME = 'documento_descarga_nombre'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE viajes ADD COLUMN documento_descarga_adjunto LONGTEXT NULL',
    'SELECT "documento_descarga_adjunto ya existe"'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'viajes'
    AND COLUMN_NAME = 'documento_descarga_adjunto'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
