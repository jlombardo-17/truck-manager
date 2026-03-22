# 🗄️ Arquitectura de Base de Datos - Truck Manager

## Visión General

Base de datos relacional (MySQL) diseñada para gestionar flota de camiones con ~10 unidades.

```
┌─────────────────────────────────────────────┐
│         USUARIOS Y AUTENTICACIÓN            │
│    (users, roles)                           │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
    CAMIONES   CHOFERES   DOCUMENTOS
    (flota)    (personal) (archivos)
        │          │
        │          └─────────────┐
        │                        │
        ▼                        ▼
    VIAJES                SALARIOS/HORAS
    (rutas)             (contable)
        │
        └─ GPS TRACKING/RUTAS
           (puntos en mapa)

    MANTENIMIENTO
    (registros, alertas)

    DASHBOARD METRICS
    (datos agregados)
```

---

## 📊 Tablas Principales

### 1. USUARIOS Y ROLES

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(100),
  apellido VARCHAR(100),
  rol VARCHAR(50) NOT NULL DEFAULT 'operador', -- admin, operador
  estado VARCHAR(20) DEFAULT 'activo', -- activo, inactivo, eliminado
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT,
  permisos JSONB DEFAULT '{}' -- Almacenar permisos como JSON
);
```

### 2. GESTIÓN DE CAMIONES

```sql
CREATE TABLE camiones (
  id SERIAL PRIMARY KEY,
  patente VARCHAR(10) UNIQUE NOT NULL,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  año INTEGER NOT NULL,
  vin VARCHAR(17),
  color VARCHAR(50),
  tipo_vehiculo VARCHAR(50), -- "Camion", "Gandola", etc
  capacidad_carga_kg INTEGER,
  odometro_km DECIMAL(10,2) DEFAULT 0, -- KM actuales
  estado VARCHAR(20) DEFAULT 'activo', -- activo, mantenimiento, inactivo
  fecha_adquisicion DATE,
  usuario_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE camiones_documentos (
  id SERIAL PRIMARY KEY,
  camion_id INTEGER NOT NULL REFERENCES camiones(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'seguro', 'verificacion', 'permiso', 'revision'
  numero_documento VARCHAR(100),
  archivo_url VARCHAR(255),
  fecha_emision DATE,
  fecha_vencimiento DATE,
  estado VARCHAR(20) DEFAULT 'vigente', -- vigente, vencido, por_vencer
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT doc_unico UNIQUE(camion_id, tipo)
);

CREATE TABLE camiones_asignaciones (
  id SERIAL PRIMARY KEY,
  camion_id INTEGER NOT NULL REFERENCES camiones(id),
  chofer_id INTEGER NOT NULL REFERENCES choferes(id),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  descripcion VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. GESTIÓN DE CHOFERES

```sql
CREATE TABLE choferes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  dni VARCHAR(15) UNIQUE NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(255),
  fecha_nacimiento DATE,
  direccion TEXT,
  ciudad VARCHAR(100),
  licencia_numero VARCHAR(20) UNIQUE NOT NULL,
  licencia_tipo VARCHAR(20), -- 'A', 'B', 'C', 'D'
  licencia_vencimiento DATE NOT NULL,
  salario_base DECIMAL(10,2) NOT NULL,
  porcentaje_comision DECIMAL(5,2) DEFAULT 0, -- % del viaje facturado
  estado VARCHAR(20) DEFAULT 'activo', -- activo, licencia, inactivo
  usuario_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE choferes_documentos (
  id SERIAL PRIMARY KEY,
  chofer_id INTEGER NOT NULL REFERENCES choferes(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'licencia', 'antecedentes', 'seguro_vida'
  archivo_url VARCHAR(255),
  fecha_emision DATE,
  fecha_vencimiento DATE,
  estado VARCHAR(20) DEFAULT 'vigente',
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT doc_chofer_unico UNIQUE(chofer_id, tipo)
);
```

### 4. VIAJES Y RUTAS

```sql
CREATE TABLE viajes (
  id SERIAL PRIMARY KEY,
  numero_viaje VARCHAR(20) UNIQUE,
  camion_id INTEGER NOT NULL REFERENCES camiones(id),
  chofer_id INTEGER NOT NULL REFERENCES choferes(id),
  fecha_inicio TIMESTAMP NOT NULL,
  fecha_fin TIMESTAMP,
  origen VARCHAR(255) NOT NULL,
  destino VARCHAR(255) NOT NULL,
  
  -- Información de la carga
  descripcion_carga TEXT,
  peso_carga_kg DECIMAL(10,2),
  valor_viaje DECIMAL(12,2), -- Valor facturado
  
  -- Información de operación
  kms_recorridos DECIMAL(10,2),
  consumo_combustible DECIMAL(10,2), -- Litros
  costo_combustible DECIMAL(10,2),
  otros_gastos DECIMAL(10,2),
  
  -- Estado
  estado VARCHAR(20) DEFAULT 'en_progreso', -- en_progreso, completado, cancelado
  notas TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE viajes_rutas (
  id SERIAL PRIMARY KEY,
  viaje_id INTEGER NOT NULL REFERENCES viajes(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL, -- Orden del punto en la ruta
  latitud DECIMAL(9,6) NOT NULL,
  longitud DECIMAL(9,6) NOT NULL,
  direccion VARCHAR(255),
  tiempo TIMESTAMP,
  odometro_km DECIMAL(10,2),
  notas VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. HORAS DE USO Y ACTIVIDADES

```sql
CREATE TABLE uso_horario (
  id SERIAL PRIMARY KEY,
  camion_id INTEGER NOT NULL REFERENCES camiones(id),
  chofer_id INTEGER,
  fecha DATE NOT NULL,
  hora_inicio TIME,
  hora_fin TIME,
  horas_totales DECIMAL(5,2),
  tipo_actividad VARCHAR(50), -- 'viaje', 'mantenimiento', 'espera', 'carga/descarga'
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. SALARIOS Y CONTABILIDAD DE CHOFERES

```sql
CREATE TABLE choferes_horas_mensuales (
  id SERIAL PRIMARY KEY,
  chofer_id INTEGER NOT NULL REFERENCES choferes(id),
  mes INTEGER NOT NULL,
  año INTEGER NOT NULL,
  horas_normales DECIMAL(10,2) DEFAULT 0,
  horas_extra DECIMAL(10,2) DEFAULT 0,
  dias_trabajados INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT horas_mes_unico UNIQUE(chofer_id, mes, año)
);

CREATE TABLE choferes_ingresos_viajes (
  id SERIAL PRIMARY KEY,
  chofer_id INTEGER NOT NULL REFERENCES choferes(id),
  viaje_id INTEGER NOT NULL REFERENCES viajes(id),
  mes INTEGER NOT NULL,
  año INTEGER NOT NULL,
  valor_viaje_facturado DECIMAL(12,2),
  comision DECIMAL(12,2), -- Calculado: valor_viaje * porcentaje_comision / 100
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE choferes_salarios_mensuales (
  id SERIAL PRIMARY KEY,
  chofer_id INTEGER NOT NULL REFERENCES choferes(id),
  mes INTEGER NOT NULL,
  año INTEGER NOT NULL,
  
  salario_base DECIMAL(12,2), -- Fijo
  comision_viajes DECIMAL(12,2) DEFAULT 0, -- Suma de comisiones
  bonos DECIMAL(12,2) DEFAULT 0,
  
  salario_bruto DECIMAL(12,2),
  
  -- Deducciones
  deducciones DECIMAL(12,2) DEFAULT 0,
  impuestos DECIMAL(12,2) DEFAULT 0,
  
  salario_neto DECIMAL(12,2),
  
  fecha_pago DATE,
  comprobante_url VARCHAR(255),
  estado_pago VARCHAR(20) DEFAULT 'pendiente', -- pendiente, pagado
  notas TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT salario_mes_unico UNIQUE(chofer_id, mes, año)
);
```

### 7. MANTENIMIENTO

```sql
CREATE TABLE mantenimiento_tipos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  costo_promedio DECIMAL(10,2),
  intervalo_kms INTEGER, -- Cada cuantos KM hacer
  intervalo_meses INTEGER, -- O cada cuantos meses
  prioridad VARCHAR(20) DEFAULT 'media' -- baja, media, alta, critica
);

CREATE TABLE mantenimiento_registros (
  id SERIAL PRIMARY KEY,
  camion_id INTEGER NOT NULL REFERENCES camiones(id),
  tipo_id INTEGER NOT NULL REFERENCES mantenimiento_tipos(id),
  fecha DATE NOT NULL,
  odometro_km DECIMAL(10,2),
  descripcion TEXT,
  costo_real DECIMAL(10,2),
  mecanico VARCHAR(100),
  proveedor VARCHAR(100),
  factura_url VARCHAR(255),
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mantenimiento_alertas (
  id SERIAL PRIMARY KEY,
  camion_id INTEGER NOT NULL REFERENCES camiones(id),
  tipo_id INTEGER NOT NULL REFERENCES mantenimiento_tipos(id),
  proxima_fecha_estimada DATE,
  proximosKms_estimados INTEGER,
  prioridad VARCHAR(20),
  estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, completado, vencido
  notificacion_enviada BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8. DASHBOARD Y MÉTRICAS

```sql
CREATE TABLE dashboard_metricas (
  id SERIAL PRIMARY KEY,
  camion_id INTEGER NOT NULL REFERENCES camiones(id),
  fecha DATE NOT NULL,
  
  -- Operación
  kms_totales DECIMAL(10,2) DEFAULT 0,
  horas_uso DECIMAL(10,2) DEFAULT 0,
  viajes_cantidad INTEGER DEFAULT 0,
  
  -- Financiero
  ingresos_total DECIMAL(12,2) DEFAULT 0,
  gastos_combustible DECIMAL(12,2) DEFAULT 0,
  gastos_mantenimiento DECIMAL(12,2) DEFAULT 0,
  gastos_totales DECIMAL(12,2) DEFAULT 0,
  
  -- Análisis
  ganancia_neta DECIMAL(12,2),
  rentabilidad_porcentaje DECIMAL(5,2),
  costo_por_km DECIMAL(10,2),
  ingreso_por_km DECIMAL(10,2),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT metrica_unica UNIQUE(camion_id, fecha)
);
```

---

## 🔑 Índices para Optimización

```sql
-- Búsquedas frecuentes
CREATE INDEX idx_choferes_dni ON choferes(dni);
CREATE INDEX idx_camiones_patente ON camiones(patente);
CREATE INDEX idx_viajes_camion ON viajes(camion_id);
CREATE INDEX idx_viajes_chofer ON viajes(chofer_id);
CREATE INDEX idx_viajes_fecha ON viajes(fecha_inicio);
CREATE INDEX idx_salarios_chofer_mes ON choferes_salarios_mensuales(chofer_id, mes, año);
CREATE INDEX idx_mantenimiento_camion ON mantenimiento_registros(camion_id);
CREATE INDEX idx_metricas_camion_fecha ON dashboard_metricas(camion_id, fecha);
```

---

## 📈 Vistas SQL Útiles (Queries Frecuentes)

```sql
-- Rentabilidad por camión (últimos 30 días)
CREATE VIEW rentabilidad_camiones_mes AS
SELECT 
  c.id, c.patente, c.marca,
  COALESCE(SUM(v.valor_viaje), 0) as ingresos,
  COALESCE(SUM(v.costo_combustible), 0) as gastos_combustible,
  COALESCE(SUM(v.otros_gastos), 0) as otros_gastos,
  COALESCE(SUM(v.valor_viaje) - SUM(v.costo_combustible) - SUM(v.otros_gastos), 0) as ganancia,
  COUNT(v.id) as viajes_cantidad
FROM camiones c
LEFT JOIN viajes v ON c.id = v.camion_id AND v.fecha_inicio >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY c.id, c.patente, c.marca;

-- Desempeño de choferes
CREATE VIEW desempeño_choferes AS
SELECT 
  ch.id, ch.nombre, ch.apellido,
  COUNT(DISTINCT v.id) as viajes_mes,
  SUM(v.kms_recorridos) as kms_totales,
  AVG(v.valor_viaje) as viaje_promedio,
  SUM(cs.comision_viajes) as comisiones_ganadas
FROM choferes ch
LEFT JOIN viajes v ON ch.id = v.chofer_id AND MONTH(v.fecha_inicio) = MONTH(CURDATE())
LEFT JOIN choferes_ingresos_viajes cs ON ch.id = cs.chofer_id
GROUP BY ch.id, ch.nombre, ch.apellido;
```

---

## 🔌 Notas Técnicas

1. **Campos Timestamp**: Todos registran `created_at` y `updated_at` para auditoría
2. **Estados**: Enumerados como VARCHAR para flexibilidad (se pueden cambiar sin migración)
3. **JSON**: `roles.permisos` y similares usan JSON para flexibilidad
4. **Camión Odómetro**: Se actualiza manualmente después de cada viaje
5. **Moneda**: DECIMAL(12,2) para precisión financiera
6. **Coordenadas**: DECIMAL(9,6) = precisión de ~10cm en GPS

---

## 📝 Próximas Migraciones

Para futuras fases, se agregan:
- Tabla de `notificaciones` (alertas a usuarios)
- Tabla de `auditorias` (logging completo)
- Tabla de `configuraciones` (settings de la app)
- Cache de métricas (Redis para panel en tiempo real)
