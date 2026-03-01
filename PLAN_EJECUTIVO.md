# 📊 Plan Ejecutivo - Truck Manager para jlombardo-17

## 🎯 Resumen del Proyecto

**Nombre**: Truck Manager  
**Descripción**: Sistema web de gestión de flota de camiones (~10 vehículos)  
**Stack**: React + Node.js/NestJS + PostgreSQL  
**Modelo de Trabajo**: Monorepo (backend + frontend en mismo repo)  
**Usuario GitHub**: jlombardo-17  

---

## 📦 Estructura del Proyecto Creada

```
C:\Users\Usuario\Proyectos\truck-manager\
├── backend/               ( API NestJS + TypeORM )
│   ├── src/
│   │   ├── modules/      ( Features: Camiones, Choferes, etc )
│   │   ├── common/       ( Guards, Decoradores, etc )
│   │   └── main.ts       ( Entrada principal )
│   ├── package.json
│   └── .env.example
│
├── frontend/             ( Aplicación React + Vite )
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── .env.example
│
├── README.md            ( Descripción general )
├── SETUP.md             ( Guía de instalación ✅ )
├── DATABASE_SCHEMA.md   ( Esquema de BD completo ✅ )
├── DEVELOPMENT_ROADMAP.md ( Plan de desarrollo 20 semanas ✅ )
└── .gitignore
```

---

## 🚀 Próximos Pasos (En Orden)

### 1️⃣ Configurar Git (5 minutos)
Abre terminal en `C:\Users\Usuario\Proyectos\truck-manager\` y ejecuta:

```bash
# Inicializar repositorio local
git init
git config user.name "Tu Nombre"
git config user.email "tu.email@gmail.com"
git add .
git commit -m "feat: Initial project setup with NestJS backend and React frontend"
```

### 2️⃣ Crear Repositorio en GitHub (3 minutos)
1. Ve a: [github.com/new](https://github.com/new)
2. Llena el formulario:
   - **Owner**: jlombardo-17
   - **Repository name**: truck-manager
   - **Description**: Sistema de gestión y mantenimiento de flota de camiones
   - **Visibility**: Private (recomendado) o Public
   - No marques las opciones de inicializar
3. Haz clic en "Create repository"

### 3️⃣ Conectar Local a GitHub (2 minutos)
```bash
# En la terminal, dentro del proyecto
git remote add origin https://github.com/jlombardo-17/truck-manager.git
git branch -M main
git push -u origin main
```

### 4️⃣ Instalar Dependencias (10 minutos)
```bash
# Desde raíz del proyecto
npm install

# Backend
cd backend
npm install
copy .env.example .env

# Frontend
cd ..\frontend
npm install
copy .env.example .env

# Volver a raíz
cd ..
```

### 5️⃣ Configurar Base de Datos (15 minutos)

**Opción A: pgAdmin (GUI)**
- Abre pgAdmin (incluido en PostgreSQL)
- Haz clic derecho en "Databases"
- "Create" → "Database"
- Nombre: `truck_manager`

**Opción B: Línea de comando**
```bash
psql -U postgres
CREATE DATABASE truck_manager;
\l
\q
```

### 6️⃣ Configurar Variables de Entorno

**backend/.env**
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=truck_manager
JWT_SECRET=mi_clave_secreta_super_segura_123456789
JWT_EXPIRES_IN=24h
API_PORT=3000
NODE_ENV=development
```

**frontend/.env**
```
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=Truck Manager
```

### 7️⃣ Ejecutar en Desarrollo (5 minutos)

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
# Verás: ✔ Listening on port 3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Verás: ✔ Local: http://localhost:5173/
```

**Verificación:**
- Backend: [http://localhost:3000](http://localhost:3000) → `"🚚 Welcome to Truck Manager API!"`
- Frontend: [http://localhost:5173](http://localhost:5173) → Page login

---

## 📅 Plan de Desarrollo (20 Semanas)

### Fase 1: MVP Básico (6 semanas)
**Objetivo**: CRUD funcional de camiones, choferes y viajes

| Sprint | Duración | Tareas |
|--------|----------|--------|
| 1-2 | 2 sem | Autenticación JWT, Login |
| 3 | 1 sem | CRUD Camiones + UI |
| 4 | 1 sem | CRUD Choferes + Documentos |
| 5 | 1 sem | CRUD Viajes, Cálculo de comisiones |

**Deliverable**: Sistema funcional de registro de viajes con cálculo de salarios basic.

---

### Fase 2: Rutas en Mapa (3 semanas)
**Objetivo**: Marcar rutas en mapa y calcular distancias automáticamente

| Sprint | Duración | Tareas |
|--------|----------|--------|
| 6 | 3 sem | Integración Leaflet, Dibujar rutas, Cálculo de KMs |

**Deliverable**: Crear viajes con rutas visuales en mapa.

---

### Fase 3: Documentos y Mantenimiento (3 semanas)
**Objetivo**: Gestión completa de documentación y alertas

| Sprint | Duración | Tareas |
|--------|----------|--------|
| 7 | 1.5 sem | Upload de documentos, Validación de vencimiento |
| 8 | 1.5 sem | Sistema de mantenimiento, Alertas automáticas |

**Deliverable**: Alertas de documentos vencidos y mantenimiento próximo.

---

### Fase 4: Contabilidad de Choferes (3 semanas)
**Objetivo**: Sistema automático de cálculo de salarios

| Sprint | Duración | Tareas |
|--------|----------|--------|
| 9 | 3 sem | Salario base + comisiones, Generación de recibos, Historial de pagos |

**Deliverable**: Sistema de nómina completo y automático.

---

### Fase 5: Dashboard y Reportes (3 semanas)
**Objetivo**: Visualización de datos y análisis de rentabilidad

| Sprint | Duración | Tareas |
|--------|----------|--------|
| 10 | 2 sem | Dashboard con gráficas, KPIs principales |
| 11 | 1 sem | Reportes exportables (PDF/Excel) |

**Deliverable**: Dashboard ejecutivo con análisis de rentabilidad por camión.

---

### Fase 6: Optimización y Deploy (2 semanas)
**Objetivo**: Llevar a producción

| Sprint | Duración | Tareas |
|--------|----------|--------|
| 12 | 2 sem | Docker, Configuración producción, Deploy en servidor |

**Deliverable**: Aplicación en vivo y accesible.

---

## 💾 Tecnología por Componente

| Componente | Tecnología | Razón |
|-----------|-----------|--------|
| **Frontend** | React + Vite | Rápido, popular, fácil de aprender |
| **Backend** | NestJS + Express | Scalable, TypeScript, estructura clara |
| **BD Principal** | PostgreSQL | Robusto, relaciones complejas, JSONB |
| **Autenticación** | JWT | Seguro, sin estado, ideal para APIs |
| **Mapas** | Leaflet | Opensource, sin API key, rápido |
| **Gráficas** | Chart.js / ECharts | Fácil integración con React, muchos tipos |
| **UI Components** | Material-UI | Componentes profesionales y theming |
| **Almacenamiento Archivos** | Local (fase 1) | Luego integrar S3 si crece |

---

## 🎓 Documentación Disponible

Fichas que ya tienes en el proyecto:

1. **[SETUP.md](SETUP.md)** ← 📖 Lee esto PRIMERO
   - Instalación paso a paso
   - Troubleshooting
   
2. **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** ← Referencia técnica
   - Todas las tablas y relaciones
   - Índices y vistas SQL
   
3. **[DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md)** ← Plan detallado
   - Qué hacer en cada sprint
   - Checklist de tareas
   - Comandos por fase

4. **[README.md](README.md)** ← Descripción general

---

## ✅ Checklist Para Hoy

- [ ] Leer [SETUP.md](SETUP.md)
- [ ] Ejecutar inicialización de Git
- [ ] Crear repositorio en GitHub
- [ ] Hacer push del proyecto
- [ ] Instalar PostgreSQL (si no lo tienes)
- [ ] Instalar Node.js 18+ (si no lo tienes)
- [ ] Ejecutar `npm install` en backend y frontend
- [ ] Crear `.env` en ambas carpetas
- [ ] Configurar BD
- [ ] Ejecutar `npm run dev` y verificar que funcione

---

## 📞 Notas Importantes

### Sobre el Salario del Chofer
El sistema está configurado para:
- **Salario Base**: Monto fijo mensual (`choferes.salario_base`)
- **Comisión**: Porcentaje del valor del viaje (`choferes.porcentaje_comision`)
- **Total Neto**: `salario_base + (suma_de_viajes × porcentaje_comision / 100) - deducciones`

Ejemplo:
- Chofer Juan: Salario base $1000, comisión 5%
- Viaje 1: $500 → Comisión: $25
- Viaje 2: $300 → Comisión: $15
- Total mes: $1000 + $25 + $15 = $1040

### Sobre las Rutas
No usamos GPS en tiempo real. En su lugar:
1. El chofer ingresa el viaje (origen/destino)
2. El operador marca puntos en un mapa haciendo clic
3. El sistema calcula automáticamente la distancia usando la fórmula de Haversine
4. Se actualiza el odómetro del camión

### Escalabilidad
Con ~10 camiones:
- No necesitas Redis (cache)
- Una sola instancia tiene más que suficiente
- PostgreSQL local es perfecta

Si crece > 100 camiones:
- Considerar microservicios
- Agregar Redis para caché
- Separar BD por módulos (sharding)

---

## 🎯 Éxito = 

✅ Sistema funcional para gestionar 10 camiones  
✅ Salarios automáticos basados en viajes  
✅ Vista de rentabilidad por camión  
✅ Dashboard intuitivo  
✅ Documentación y alertas de mantenimiento  

**¡Éxito en tu proyecto!** 🚀
