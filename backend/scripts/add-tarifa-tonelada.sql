-- Tarifa por tonelada (y su moneda) usada para calcular el valor del viaje.
-- Compatible con MySQL 8+

ALTER TABLE viajes
  ADD COLUMN tarifa_por_tonelada DECIMAL(12,2) NULL,
  ADD COLUMN moneda_tarifa VARCHAR(3) NULL;
