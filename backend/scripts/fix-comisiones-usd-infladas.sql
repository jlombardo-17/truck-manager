-- Corrige comisiones de "Operario" infladas por el bug de conversión USD
-- (se cargaron $1.000 UYU y el backend las guardó como US$1.000 × 40,5894).
-- Correr DESPUÉS de add-comision-moneda.sql. Es idempotente: solo toca filas
-- que siguen con el monto inflado exacto.
-- Compatible con MySQL 8+

-- 1) Revisar qué filas se van a tocar (deberían ser 5):
SELECT v.numeroViaje, c.id, c.tipo, c.porcentaje, c.montoFijo, c.montoTotal
FROM viajes_comisiones c
JOIN viajes v ON v.id = c.viaje_id
WHERE v.moneda = 'USD'
  AND c.tipo = 'Operario'
  AND c.montoFijo = 40589.38
  AND v.numeroViaje IN (
    'VIAJE-20261119-1782', 'VIAJE-20261119-9370', 'VIAJE-20261120-9685',
    'VIAJE-20261120-5954', 'VIAJE-20261121-8060'
  );

-- 2) Corregir a $1.000 UYU:
UPDATE viajes_comisiones c
JOIN viajes v ON v.id = c.viaje_id
SET c.montoFijo = 1000, c.montoTotal = 1000, c.porcentaje = NULL, c.moneda = 'UYU'
WHERE v.moneda = 'USD'
  AND c.tipo = 'Operario'
  AND c.montoFijo = 40589.38
  AND v.numeroViaje IN (
    'VIAJE-20261119-1782', 'VIAJE-20261119-9370', 'VIAJE-20261120-9685',
    'VIAJE-20261120-5954', 'VIAJE-20261121-8060'
  );
