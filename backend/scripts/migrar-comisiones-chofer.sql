-- Comisiones de chofer unificadas + costo empresa.
--
-- 1) Columnas nuevas (en dev las crea TypeORM sync; en Railway correr esta parte a mano):
--    - choferes.costo_empresa / choferes_salarios.costo_empresa: costo empresa cargado a mano.
--    - chofer_viatico.viaje_id: líneas "Viaje/comisión" generadas desde las comisiones
--      tipo "Chofer" de un viaje (se borran solas al borrar el viaje).
-- 2) Las comisiones ya cargadas cuyo beneficiario es el chofer del viaje (ej. tipo
--    "Operario", beneficiario "Hugo Rey" en un viaje de Hugo Saul Rey Antunez) pasan a
--    tipo "Chofer".
-- 3) Después de correr 1 y 2, llamar UNA vez a POST /viajes/comisiones-chofer/sincronizar
--    para generar las líneas en las jornadas y recalcular los salarios pendientes.
-- 4) Recién entonces, revisar y borrar las comisiones duplicadas cargadas a mano.
--
-- Los pasos 2 a 4 son idempotentes; el 1 falla si las columnas ya existen. MySQL 8+

-- ---------- 1) Esquema (omitir en dev si ya lo creó TypeORM) ----------
ALTER TABLE choferes ADD COLUMN costo_empresa DECIMAL(12,2) NULL;
ALTER TABLE choferes_salarios ADD COLUMN costo_empresa DECIMAL(12,2) NULL;
ALTER TABLE chofer_viatico
  ADD COLUMN viaje_id INT NULL,
  ADD CONSTRAINT FK_chofer_viatico_viaje FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE CASCADE;

-- ---------- 2) Comisiones al chofer del viaje → tipo "Chofer" ----------
-- Criterio: el beneficiario contiene el primer nombre y el primer apellido del chofer
-- del viaje, y no nombra a nadie más ("Hugo Rey y Federico" queda como está).

-- 2a) Revisar qué filas se van a tocar:
SELECT v.numeroViaje, c.id, c.tipo, c.concepto, c.beneficiario, c.montoTotal,
       CONCAT(ch.nombre, ' ', ch.apellido) AS chofer_del_viaje
FROM viajes_comisiones c
JOIN viajes v ON v.id = c.viaje_id
JOIN choferes ch ON ch.id = v.chofer_id
WHERE LOWER(TRIM(c.tipo)) <> 'chofer'
  AND c.beneficiario LIKE CONCAT('%', SUBSTRING_INDEX(TRIM(ch.nombre), ' ', 1), '%')
  AND c.beneficiario LIKE CONCAT('%', SUBSTRING_INDEX(TRIM(ch.apellido), ' ', 1), '%')
  AND c.beneficiario NOT REGEXP '( y | e |,|/|&)'
ORDER BY v.fechaInicio;

-- 2b) Convertirlas:
UPDATE viajes_comisiones c
JOIN viajes v ON v.id = c.viaje_id
JOIN choferes ch ON ch.id = v.chofer_id
SET c.tipo = 'Chofer'
WHERE LOWER(TRIM(c.tipo)) <> 'chofer'
  AND c.beneficiario LIKE CONCAT('%', SUBSTRING_INDEX(TRIM(ch.nombre), ' ', 1), '%')
  AND c.beneficiario LIKE CONCAT('%', SUBSTRING_INDEX(TRIM(ch.apellido), ' ', 1), '%')
  AND c.beneficiario NOT REGEXP '( y | e |,|/|&)';

-- ---------- 4) Quitar las comisiones cargadas a mano en jornadas ----------
-- Correr DESPUÉS de la sincronización (paso 3). Las líneas "Viaje/comisión" cargadas
-- a mano duplican las que ahora se generan desde los viajes. En dev eran 10 líneas de
-- Hugo Saul Rey Antunez (chofer_id 4) por $22.000. Revisar antes de borrar.

-- 4a) Revisar:
SELECT j.fecha, CONCAT(ch.nombre, ' ', ch.apellido) AS chofer, v.concepto, v.cantidad, v.monto
FROM chofer_viatico v
JOIN chofer_jornada j ON j.id = v.jornada_id
JOIN choferes ch ON ch.id = j.chofer_id
WHERE v.tipo = 'viaje_comision' AND v.viaje_id IS NULL
ORDER BY ch.id, j.fecha;

-- 4b) Borrar (ajustar el chofer si en producción aparecen otros):
DELETE v FROM chofer_viatico v
JOIN chofer_jornada j ON j.id = v.jornada_id
WHERE v.tipo = 'viaje_comision' AND v.viaje_id IS NULL AND j.chofer_id = 4;
