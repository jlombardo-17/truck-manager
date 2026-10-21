-- Gastos fijos anuales por camión (seguro, patente, etc.)
-- Los reportes los prorratean por día (montoAnual / 365) dentro de la vigencia.
-- Compatible con MySQL 8+

CREATE TABLE IF NOT EXISTS gastos_fijos (
  id INT NOT NULL AUTO_INCREMENT,
  camionId INT NOT NULL,
  tipo ENUM('seguro', 'patente', 'otro') NOT NULL DEFAULT 'otro',
  concepto VARCHAR(255) NULL,
  montoAnual DECIMAL(12, 2) NOT NULL,
  moneda VARCHAR(3) NOT NULL DEFAULT 'UYU',
  vigenciaDesde DATE NOT NULL,
  vigenciaHasta DATE NULL,
  notas TEXT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  CONSTRAINT FK_gastos_fijos_camion FOREIGN KEY (camionId) REFERENCES camiones (id) ON DELETE CASCADE
);
