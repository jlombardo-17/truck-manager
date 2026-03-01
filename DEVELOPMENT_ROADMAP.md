# 🗺️ Roadmap de Desarrollo - Truck Manager

## Fase 1: MVP Básico (Semanas 1-6)

### ✅ Sprint 1-2: Setup y Autenticación (Semanas 1-2)
- [ ] Configurar entorno de desarrollo completo
- [ ] Crear BD con tabla de USUARIOS y ROLES
- [ ] Implementar autenticación JWT (Backend)
- [ ] Login básico (Frontend)
- [ ] Página Dashboard vacía (solo protección de ruta)

**Entregas**:
- Backend escuchando en `localhost:3000`
- Frontend corriendo en `localhost:5173`
- Autenticación funcionando (login/logout)

---

### ✅ Sprint 3: Gestión de Camiones (Semanas 3-4)

**Backend**:
- [ ] Crear entidad TypeORM: `Camiones`
- [ ] Crear módulo `camiones` (NestJS)
- [ ] Endpoints CRUD:
  - `GET /api/camiones` (listar)
  - `GET /api/camiones/:id` (detalle)
  - `POST /api/camiones` (crear)
  - `PUT /api/camiones/:id` (editar)
  - `DELETE /api/camiones/:id` (eliminar)
- [ ] Validaciones con class-validator

**Frontend**:
- [ ] Página de Listado de Camiones
- [ ] Formulario para crear/editar camión
- [ ] Tabla con búsqueda y filtros básicos
- [ ] Botones de editar/eliminar

**Entregas**:
```
GET /api/camiones → [{id: 1, patente: "ABC123", marca: "Volvo", ...}]
```

---

### ✅ Sprint 4: Gestión de Choferes (Semanas 4-5)

**Backend**:
- [ ] Crear entidad: `Choferes`
- [ ] Crear módulo `choferes`
- [ ] Endpoints CRUD (igual a camiones)
- [ ] Relación con USUARIOS (un chofer = un usuario)

**Frontend**:
- [ ] Página de Listado de Choferes
- [ ] Formulario crear/editar chofer
- [ ] Vista de datos personales, licencia, documentación

**Entregas**:
```
GET /api/choferes → [{id: 1, nombre: "Juan", dni: "12345678", ...}]
```

---

### ✅ Sprint 5: Gestión de Viajes (Semana 5-6)

**Backend**:
- [ ] Crear entidad: `Viajes`
- [ ] Endpoints CRUD
- [ ] Relaciones: Viajes → Camión + Chofer
- [ ] Cálculo automático:
  - `kms_recorridos` = distancia de ruta
  - `valor_viaje` × `porcentaje_comision_chofer` = comisión
  - Actualizar odómetro del camión

**Frontend**:
- [ ] Página Crear Viaje (form con selector de camión/chofer)
- [ ] Listado de Viajes con filtros

**Entregas**:
```
POST /api/viajes → {camion_id, chofer_id, origen, destino, valor_viaje}
```

---

## Fase 2: Rutas en Mapa (Semanas 7-9)

### 🗺️ Sprint 6: Integración Leaflet/Mapbox

**Frontend**:
- [ ] Instalar `leaflet` y `react-leaflet`
- [ ] Crear componente `<MapRouteEditor>`
- [ ] Permitir hacer clic en mapa para agregar puntos de ruta
- [ ] Mostrar línea entre puntos
- [ ] Calcular distancia total automáticamente (Haversine formula)

**Backend**:
- [ ] Crear entidad: `VijesRutas` (puntos GPS)
- [ ] Endpoint para guardar ruta:
  ```
  POST /api/viajes/:id/ruta → [{lat, lng, orden, distancia}]
  ```

**UI/UX**:
- [ ] Interfaz intuitiva para marcar ruta
- [ ] Mostrar KM totales en tiempo real
- [ ] Poder editar puntos (arrastrar, eliminar)

---

## Fase 3: Documentación y Mantenimiento (Semanas 10-12)

### 📎 Sprint 7: Documentos

**Backend**:
- [ ] Crear tablas: `camiones_documentos` y `choferes_documentos`
- [ ] Endpoints para subir archivos (integrar AWS S3 o almacenamiento local)
- [ ] Validar vencimiento automático

**Frontend**:
- [ ] Sección "Documentos" en detalle de Camión y Chofer
- [ ] Upload de archivos
- [ ] Mostrar estado de vencimiento (vigente/próximo a vencer/vencido)

---

### 🔧 Sprint 8: Gestión de Mantenimiento

**Backend**:
- [ ] Crear tablas: `mantenimiento_tipos`, `mantenimiento_registros`, `mantenimiento_alertas`
- [ ] Endpoints:
  - `GET /api/mantenimiento/tipos` (tareas predefinidas)
  - `POST /api/camiones/:id/mantenimiento` (registrar mantenimiento)
  - `GET /api/camiones/:id/alertas-mantenimiento` (alertas activas)

**Frontend**:
- [ ] Página: Registro de Mantenimiento
- [ ] Tabla de actividades realizadas
- [ ] Widget: Alertas próximas (rojo si vencido, amarillo si próximo)

---

## Fase 4: Contabilidad de Choferes (Semanas 13-15)

### 💰 Sprint 9: Sistema de Salarios

**Backend**:
- [ ] Crear tablas: `choferes_salarios_mensuales`, `choferes_ingresos_viajes`
- [ ] Lógica de cálculo:
  ```
  salario_neto = (salario_base + SUMA(comisiones_viajes)) - deducciones
  comision = valor_viaje × porcentaje_comision / 100
  ```
- [ ] Endpoints:
  - `GET /api/choferes/:id/salarios` (historial)
  - `GET /api/choferes/:id/salario/:mes/:año` (detalle)
  - `POST /api/salarios/generar/:mes/:año` (calcular salarios automáticos)

**Frontend**:
- [ ] Página: Salarios de Chofer
- [ ] Vista de desglose: Base + Comisiones + Deducciones = Neto
- [ ] Tabla de viajes facturados en el mes (mostrando comisión de cada uno)
- [ ] Botón: Generar recibo PDF
- [ ] Histórico de salarios pagos

---

## Fase 5: Dashboard y Reportes (Semanas 16-18)

### 📊 Sprint 10: Dashboard Principal

**Backend**:
- [ ] Crear tabla: `dashboard_metricas`
- [ ] Endpoints para datos agregados:
  - `GET /api/dashboard/resumen` (KPIs generales)
  - `GET /api/dashboard/camiones/:id` (desempeño por camión)
  - `GET /api/dashboard/choferes/:id` (desempeño por chofer)

**Frontend**:
- [ ] Página inicial: Dashboard con cards de:
  - Camiones activos hoy
  - Ingresos totales del mes
  - Gastos totales
  - Mantenimiento próximo
- [ ] Gráficas:
  - Ingresos vs Gastos (últimos 30 días)
  - Disponibilidad de camiones
  - Eficiencia de choferer

---

### 📈 Sprint 11: Reportes Avanzados

**Backend**:
- [ ] Endpoint para generar datos de reportes
- [ ] Integrar librería de PDF (PDFKit o ReportLab)

**Frontend**:
- [ ] Página: Reportes
- [ ] Tipos de reportes:
  - Rentabilidad por camión
  - Desempeño de choferes
  - Gastos de mantenimiento
  - Ingresos mensuales
- [ ] Botón: Exportar a PDF / Excel

---

## Fase 6: Optimizaciones y Deploy (Semanas 19-20)

### 🚀 Sprint 12: Deployment

- [ ] Crear archivo `docker-compose.yml` (BD + Backend + Frontend)
- [ ] Configurar variables de entorno para producción
- [ ] Desplegar en servidor (AWS, DigitalOcean, Heroku)
- [ ] Configurar HTTPS / SSL
- [ ] Testing básico

---

## 📋 Checklist por Sprints

### Sprint 1-2: Autenticación
- [ ] BD usuarios y roles creada
- [ ] Endpoints login/logout funcionales
- [ ] Frontend protegido por autenticación
- [ ] Test: Login correcto y rechaza credenciales inválidas

### Sprint 3: Camiones
- [ ] CRUD de camiones funcional
- [ ] Validaciones en backend
- [ ] Interfaz frontend responsive
- [ ] Test: CREATE, READ, UPDATE, DELETE

### Sprint 4: Choferes
- [ ] CRUD de choferes
- [ ] Relación usuario-chofer
- [ ] Test: Crear chofer, editar, eliminar

### Sprint 5: Viajes
- [ ] CRUD viajes
- [ ] Cálculo de comisiones
- [ ] Actualización de odómetro
- [ ] Test: Viaje completo de A a B

### Sprint 6: Rutas en Mapa
- [ ] Mapa funcional
- [ ] Agregar puntos haciendo clic
- [ ] Calcular distancia
- [ ] Test: Ruta de 100 KM calculada correctamente

### Sprint 7-8: Documentos y Mantenimiento
- [ ] Upload de documentos
- [ ] Alertas de vencimiento
- [ ] Registro de mantenimiento
- [ ] Test: Alertas disparan correctamente

### Sprint 9: Salarios
- [ ] Cálculo automático de salarios
- [ ] Comisiones aplicadas correctamente
- [ ] Generación de recibos
- [ ] Test: Chofer con viajes genera comisiones

### Sprint 10-11: Dashboard
- [ ] Gráficas en tiempo real
- [ ] Reportes descargables
- [ ] KPIs calculados correctamente
- [ ] Test: Datos coinciden con BD

### Sprint 12: Deploy
- [ ] Servidor en vivo
- [ ] BD en producción
- [ ] CI/CD configurado
- [ ] Backups automáticos

---

## 🎯 Indicadores de Progreso

| Métrica | Objetivo |
|---------|----------|
| Camiones CRUD | 100% (Sprint 3) |
| Choferes CRUD | 100% (Sprint 4) |
| Viajes con rutas | 100% (Sprint 6) |
| Salarios automáticos | 100% (Sprint 9) |
| Dashboard funcional | 100% (Sprint 10) |
| Cobertura de tests | 60%+ (Sprint 12) |

---

## ⚡ Comandos para Ejecutar por Sprint

### Sprint 1-2
```bash
npm run dev
# Verify: http://localhost:3000/health → {"status":"ok"}
# Verify: http://localhost:5173 → Login form
```

### Sprint 3
```bash
# Backend
curl http://localhost:3000/api/camiones
# Frontend
# Test: Agregar camión, verificar en tabla
```

### Sprint 5+
```bash
# Data-driven testing
npm run test
npm run test:cov
```

---

## 📅 Timeline Total

- **Semanas 1-6**: MVP funcional (CRUD básico)
- **Semanas 7-9**: Rutas en mapa
- **Semanas 10-12**: Documentos + Mantenimiento
- **Semanas 13-15**: Contabilidad de choferes
- **Semanas 16-18**: Dashboard y reportes
- **Semanas 19-20**: Deploy y optimizaciones

**Total Estimado**: 20 semanas (~5 meses) trabajando a media jornada.

---

## 🔗 Links Útiles

- [NestJS Docs](https://docs.nestjs.com)
- [React Vite Template](https://vitejs.dev/guide/#trying-vite-online)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [Material-UI Components](https://mui.com/components)
- [MySQL Best Practices](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)
