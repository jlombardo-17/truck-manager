-- Moneda por comisión de viaje (UYU/USD).
-- montoFijo y montoBase quedan en esta moneda; montoTotal sigue siempre en UYU.
-- Las filas existentes tienen sus montos ya convertidos a UYU, así que el
-- default 'UYU' las describe correctamente.
-- Compatible con MySQL 8+

ALTER TABLE viajes_comisiones
  ADD COLUMN moneda VARCHAR(3) NOT NULL DEFAULT 'UYU';
