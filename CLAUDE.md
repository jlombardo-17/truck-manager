# Truck Manager — Contexto del Proyecto

## Descripción

Aplicación web para gestión de flota de camiones: vehículos, choferes, viajes, mantenimiento, salarios y reportes financieros.

El usuario principal es ingeniero de software con perfil backend. Las respuestas deben asumir ese nivel técnico.

## Stack

**Backend:** NestJS 10 + TypeORM + MySQL 8.0 + JWT (Passport.js)

**Frontend:** React 18 + Vite + TypeScript + Material-UI 5 + Axios + Leaflet (mapas) + Chart.js + jsPDF

**Infra:** Docker Compose (dev/prod) + Nginx + Railway (producción)

## Estructura

```
truck-manager/
├── backend/src/
│   ├── modules/
│   │   ├── auth/          # Login, registro, JWT strategy
│   │   ├── users/         # Usuarios y seeding
│   │   ├── camiones/      # Camiones, documentos, mantenimiento, combustible
│   │   ├── choferes/      # Choferes, documentos, salarios, pagos
│   │   ├── viajes/        # Viajes, rutas, comisiones
│   │   ├── dashboard/     # KPIs y métricas
│   │   └── reportes/      # Exportación PDF/Excel
│   └── common/guards/     # jwt-auth.guard.ts
├── frontend/src/
│   ├── pages/             # 14 páginas principales
│   ├── components/        # 20+ componentes reutilizables
│   ├── contexts/          # AuthContext.tsx
│   ├── services/          # 14 archivos de servicios Axios
│   ├── types/             # Interfaces TypeScript por entidad
│   └── utils/             # dateUtils.ts (getTodayLocalInputValue, toDateInputValue, formatDate)
└── docs/                  # Documentación técnica
```

## Entidades principales (DB)

| Entidad | Tabla | Campos clave |
|---|---|---|
| `User` | `users` | id, email, passwordHash, firstName, lastName, role |
| `Camion` | `camiones` | id, patente, marca, modelo, anio, estado, odometroKm |
| `CamionDocumento` | `camion_documento` | id, camionId, tipo, numeroDocumento, fechaVencimiento |
| `ConfiguracionVehicular` | `configuracion_vehicular` | id, camionId, especificaciones técnicas |
| `MantenimientoRegistro` | `mantenimiento_registro` | id, camionId, tipo, fecha, costo |
| `MantenimientoTipo` | `mantenimiento_tipo` | id, nombre, descripcion |
| `Repostada` | `repostada` | id, camionId, fecha, litros, costoPorLitro |
| `Servicio` | `servicio` | id, camionId, descripcion, costo |
| `Chofer` | `choferes` | id, numeroDocumento, nombre, apellido, telefono, estado |
| `ChoferDocumento` | `chofer_documento` | id, choferId, tipo, numeroDocumento, fechaVencimiento |
| `ChoferSalario` | `chofer_salario` | id, choferId, sueldoBase, porcentajeComision |
| `ChoferSalarioPago` | `chofer_salario_pago` | id, choferId, monto, fecha |
| `Viaje` | `viajes` | id, numeroViaje, camionId, choferId, origen, destino, valorViaje, moneda, kmRecorridos |
| `ViajRuta` | `viaje_ruta` | id, viajeId, orden, latitud, longitud, direccion |
| `ViajComision` | `viaje_comision` | id, viajeId, tipo, concepto, montoBase, porcentaje, beneficiario |

## Módulos backend relevantes

- **camiones:** CRUD de camiones + documentos + mantenimiento + alertas + combustible + servicios
- **choferes:** CRUD de choferes + documentos + salarios base + comisiones + pagos
- **viajes:** Registro de viajes, cálculo de distancias (OSRM), asignación de chofer, cálculo de comisiones
- **dashboard:** Aggregaciones financieras, rentabilidad, KPIs
- **reportes:** Exportación PDF y Excel de viajes y datos financieros

## Patrón de módulo backend (NestJS)

Cada módulo sigue esta estructura estándar:

```
modules/<nombre>/
├── <nombre>.module.ts        # TypeOrmModule.forFeature([...entities])
├── <nombre>.controller.ts    # @Controller('<nombre>'), @UseGuards(JwtAuthGuard)
├── <nombre>.service.ts       # @Injectable(), lógica de negocio
├── <nombre>.entity.ts        # @Entity(), columnas TypeORM
└── dto/
    ├── create-<nombre>.dto.ts  # @IsString, @IsInt, @IsOptional (class-validator)
    └── update-<nombre>.dto.ts  # PartialType(Create<Nombre>Dto)
```

**Métodos de servicio estándar:** `findAll()`, `findOne(id)`, `create(dto)`, `update(id, dto)`, `remove(id)`

**Guard:** Todos los controllers usan `@UseGuards(JwtAuthGuard)` de `src/common/guards/jwt-auth.guard.ts`

**TypeORM sync:** `synchronize: true` en desarrollo — las entidades se sincronizan automáticamente con la DB al iniciar.

## Patrón de servicio frontend (Axios)

```typescript
// frontend/src/services/<entidad>Service.ts
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

// Interceptor agrega Authorization: Bearer <token> automáticamente
// Ver responseNormalizer.ts para normalización de respuestas de array

export const <entidad>Service = {
  getAll: (): Promise<Entidad[]>
  getById: (id: number): Promise<Entidad>
  create: (dto: CreateEntidadDto): Promise<Entidad>
  update: (id: number, dto: UpdateEntidadDto): Promise<Entidad>
  delete: (id: number): Promise<void>
}
```

Los tipos viven en `frontend/src/types/<entidad>.ts`.

## Páginas frontend

| Página | Archivo | Descripción |
|---|---|---|
| Dashboard | `Dashboard.tsx` | KPIs, acceso rápido, métricas |
| Camiones | `Camiones.tsx` | Listado con filtros |
| Camión Form | `CamionForm.tsx` | Crear/editar |
| Camión Detalle | `CamionDetalle.tsx` | Tabs: documentos, mantenimiento, servicios, combustible |
| Choferes | `Choferes.tsx` | Listado con filtros |
| Chofer Form | `ChoferForm.tsx` | Crear/editar |
| Chofer Detalle | `ChoferDetalle.tsx` | Tabs: documentos, salarios |
| Chofer Salarios | `ChoferSalarios.tsx` | Gestión de estructura salarial |
| Salario Detalle | `SalarioDetalle.tsx` | Detalle y pagos |
| Viajes | `Viajes.tsx` | Listado con exportación PDF |
| Viaje Form | `ViajeForm.tsx` | Crear/editar con mapa de rutas (Leaflet) |
| Reportes | `Reportes.tsx` | Reportes financieros + exportación PDF/Excel |
| Clima | `Clima.tsx` | Widget de clima integrado |
| Login | `Login.tsx` | Autenticación |

## Convenciones

- **Idioma:** Español para entidades, endpoints, variables y UI (camion, chofer, viaje, repostada, etc.)
- **Moneda:** UYU (pesos uruguayos) por defecto; algunos viajes pueden ser en USD
- **Fechas:** Usar funciones de `utils/dateUtils.ts` — nunca `new Date()` directo para inputs HTML
- **Autenticación:** `JwtAuthGuard` en todos los endpoints. Frontend usa `useAuth()` de `AuthContext`
- **Validación:** DTOs con `class-validator` (`@IsString`, `@IsInt`, `@IsOptional`, `@IsEnum`)
- **Rutas protegidas frontend:** `ProtectedRoute.tsx` redirige a `/login` si no hay token JWT

## Variables de entorno

**Backend (`backend/.env`):**
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `API_PORT` (default: 3000), `NODE_ENV`
- `DEV_SEED_EMAIL`, `DEV_SEED_PASSWORD` — usuario admin para desarrollo

**Frontend (`frontend/.env`):**
- `VITE_API_BASE_URL=http://localhost:3000`
- `VITE_APP_NAME=Truck Manager`

## Entorno local de desarrollo

- **Backend:** `cd backend && npm run start:dev` → `http://localhost:3000`
- **Frontend:** `cd frontend && npm run dev` → `http://localhost:5173` (o 5174 si el puerto está ocupado)
- **DB local:** MySQL 8.0, base `truck_manager`, usuario `root`
- **Usuario seed:** `admin@truckmanager.local` / `admin123`
- **TypeORM sync:** activo en dev, las migraciones de schema son automáticas

## Docs de referencia

- `docs/API_ENDPOINTS.md` — endpoints completos con ejemplos
- `docs/DATABASE_SCHEMA.md` — esquema de DB con relaciones
- `docs/QUICK_START.md` — setup inicial
