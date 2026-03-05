# 🗺️ Roadmap de Desarrollo - Truck Manager

## ✅ Fase 1: MVP Básico (Semanas 1-6) - COMPLETADO

### ✅ Sprint 1-2: Setup y Autenticación (Semanas 1-2) - COMPLETADO
- ✅ Configurar entorno de desarrollo completo
- ✅ Crear BD con tabla de USUARIOS y ROLES
- ✅ Implementar autenticación JWT (Backend)
- ✅ Login básico (Frontend)
- ✅ Página Dashboard funcional

**Entregas**:
- ✅ Backend escuchando en `localhost:3000`
- ✅ Frontend corriendo en `localhost:5173`
- ✅ Autenticación funcionando (login/logout)

---

### ✅ Sprint 3: Gestión de Camiones (Semanas 3-4) - COMPLETADO

**Backend**:
- ✅ Crear entidad TypeORM: `Camiones`
- ✅ Crear módulo `camiones` (NestJS)
- ✅ Endpoints CRUD completos
- ✅ Validaciones con class-validator
- ✅ Gestión de documentos, servicios y repostadas

**Frontend**:
- ✅ Página de Listado de Camiones
- ✅ Formulario para crear/editar camión
- ✅ Vista detalle con tabs (Info, Documentos, Servicios, Repostadas)
- ✅ Tabla con búsqueda y filtros
- ✅ Estadísticas de consumo

---

### ✅ Sprint 4: Gestión de Choferes (Semanas 4-5) - COMPLETADO

**Backend**:
- ✅ Crear entidad: `Choferes`
- ✅ Crear módulo `choferes`
- ✅ Endpoints CRUD completos
- ✅ Relación con USUARIOS

**Frontend**:
- ✅ Página de Listado de Choferes
- ✅ Formulario crear/editar chofer
- ✅ Vista de datos personales, licencia, documentación

---

### ✅ Sprint 5: Gestión de Viajes (Semana 5-6) - COMPLETADO

**Backend**:
- ✅ Crear entidad: `Viajes` con `ViajRutas` y `ViajComisiones`
- ✅ Endpoints CRUD completos
- ✅ Relaciones: Viajes → Camión + Chofer
- ✅ Cálculo de comisiones automático
- ✅ Sistema de estados (en_progreso, completado, cancelado)

**Frontend**:
- ✅ Página Crear/Editar Viaje con formulario completo
- ✅ Listado de Viajes con filtros por estado, camión, chofer
- ✅ Gestión de comisiones con cálculo automático
- ✅ Cálculo de ganancia neta en tiempo real

---

## ✅ Fase 2: Rutas en Mapa (Semanas 7-9) - COMPLETADO

### ✅ Sprint 6: Integración Leaflet/OSRM - COMPLETADO

**Frontend**: 
- ✅ Componente `MapEditor` con Leaflet
- ✅ Click en mapa para agregar puntos de ruta
- ✅ Visualización de línea entre puntos (polyline)
- ✅ Integración con OSRM para cálculo de distancia real por carretera
- ✅ Visualización de geometría de ruta óptima
- ✅ Cálculo automático de distancia (Haversine como fallback)
- ✅ Panel lateral con lista de puntos editable

**Backend**: 
- ✅ Entidad `ViajRutas` implementada
- ✅ Endpoint `GET /api/viajes/:id/rutas`
- ✅ Endpoint `POST /api/viajes/:id/rutas`
- ✅ Integración con OSRM (router.project-osrm.org)
- ✅ Cálculo de ruta óptima (2 puntos: routing, 3+: trip optimization)
- ✅ Actualización automática de `kmRecorridos` con distancia real
- ✅ Fallback a Haversine si OSRM no disponible

**Características implementadas:**
- ✅ Distancia en línea recta vs distancia por carretera
- ✅ Optimización de waypoints (mantiene origen/destino fijos)
- ✅ Loading states durante cálculos
- ✅ Conversión automática de valores numéricos en DTOs
- ✅ Manejo robusto de errores (toFixed, valores null/undefined)

---

## ✅ Fase 3: Documentación Mejorada (Semanas 10-12) - COMPLETADO

### ✅ Sprint 7: Gestión Mejorada de Documentos - COMPLETADO

**Backend**:
- ✅ Crear entidad `ChoferDocumento` con TypeORM
- ✅ 8 tipos de documentos (DNI, Licencia, Carnet Salud, etc.)
- ✅ Sistema de alertas de vencimiento:
  - `GET /documentos/proximos-vencer?dias=30` - Documentos próximos a vencer
  - `GET /documentos/vencidos` - Documentos vencidos
- ✅ Lógica de estados: vigente (>30 días), proximo_vencer (0-30 días), vencido (<0 días)
- ✅ CRUD completo para documentos de choferes
- ✅ Sistema de alertas agregado también a documentos de camiones

**Frontend**:
- ✅ Componente reutilizable `DocumentoEstadoBadge`:
  - 4 estados con colores: vigente (verde), proximo_vencer (amarillo), vencido (rojo), sin_vencimiento (gris)
  - Muestra días restantes/vencidos
  - Integrado en CamionDetalle y ChoferDetalle
- ✅ Página completa `ChoferDetalle`:
  - Vista con tabs: Información Personal, Documentos
  - CRUD de documentos inline
  - Visualización de estado de cada documento
  - Navegación desde lista de choferes (botón "Ver Detalle" 👁️)
- ✅ Servicios frontend: `choferDocumentosService` con métodos de alertas
- ✅ Tipos TypeScript completos para documentos de chofer

**Notas**:
- ⚠️ Upload de archivos físicos aún no implementado (por ahora solo rutaArchivo como string)
- ⚠️ Integración con AWS S3 o almacenamiento local pendiente para futuras iteraciones

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
