-- Permite adjuntar varios documentos de descarga por viaje
-- Compatible con MySQL 8+
-- Los viajes con el adjunto único anterior (documento_descarga_adjunto) se siguen
-- mostrando sin migrar datos: el backend los expone dentro de la lista nueva.

SET @db_name = DATABASE();

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE viajes ADD COLUMN documentos_descarga_adjuntos JSON NULL',
    'SELECT "documentos_descarga_adjuntos ya existe"'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'viajes'
    AND COLUMN_NAME = 'documentos_descarga_adjuntos'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
