-- Clientes (dadores de carga) y relación opcional desde viajes.
-- Compatible con MySQL 8+

CREATE TABLE IF NOT EXISTS clientes (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  rut VARCHAR(20) NULL,
  telefono VARCHAR(50) NULL,
  email VARCHAR(255) NULL,
  direccion VARCHAR(255) NULL,
  notas TEXT NULL,
  activo TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY UQ_clientes_nombre (nombre)
);

ALTER TABLE viajes
  ADD COLUMN cliente_id INT NULL,
  ADD CONSTRAINT FK_viajes_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE SET NULL;
