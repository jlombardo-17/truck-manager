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
│   ├── pages/             # 13 páginas principales
│   ├── components/        # 20+ componentes reutilizables
│   ├── services/          # 13 archivos de servicios Axios
│   ├── types/             # Interfaces TypeScript
│   └── utils/             # Funciones utilitarias (fechas, moneda, etc.)
└── docs/                  # 23 archivos de documentación técnica
```

## Entidades principales (DB)

| Entidad | Descripción |
|---|---|
| `users` | Usuarios del sistema |
| `camion` | Datos del camión |
| `camion_documento` | Permisos, seguros, inspecciones |
| `configuracion_vehicular` | Especificaciones técnicas |
| `mantenimiento_registro` | Registro de mantenimientos |
| `mantenimiento_tipo` | Categorías de mantenimiento |
| `repostada` | Recargas de combustible |
| `servicio` | Servicios generales al camión |
| `chofer` | Datos del chofer |
| `chofer_documento` | Documentos del chofer |
| `chofer_salario` | Estructura salarial (base + comisión %) |
| `chofer_salario_pago` | Pagos de salario realizados |
| `viaje` | Información del viaje con coordenadas GPS |
| `viaje_ruta` | Puntos de ruta |
| `viaje_comision` | Comisiones calculadas por viaje |

## Módulos backend relevantes

- **camiones:** CRUD de camiones + documentos + mantenimiento + alertas + combustible + servicios
- **choferes:** CRUD de choferes + documentos + salarios base + comisiones + pagos
- **viajes:** Registro de viajes, cálculo de distancias (OSRM), asignación de chofer, cálculo de comisiones
- **dashboard:** Aggregaciones financieras, rentabilidad, KPIs
- **reportes:** Exportación PDF y Excel de viajes y datos financieros

## Convenciones

- Español para nombres de entidades, endpoints y UI (camion, chofer, viaje, repostada, etc.)
- Moneda por defecto: UYU (pesos uruguayos)
- Rutas protegidas con `JwtAuthGuard`
- DTOs con `class-validator` y `class-transformer`
- El frontend usa `AuthContext` para estado de autenticación global

## Variables de entorno relevantes

**Backend:** `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`

**Frontend:** `VITE_API_BASE_URL`, `VITE_APP_NAME`

## Docs de referencia

- `docs/API_ENDPOINTS.md` — endpoints completos
- `docs/DATABASE_SCHEMA.md` — esquema de DB con relaciones
- `docs/QUICK_START.md` — setup en 5 pasos
