# 🚚 Truck Manager - Sistema de Gestión de Flota

Sistema integral de gestión y mantenimiento de flota de camiones, con control de choferes, viajes, mantenimiento y análisis de rentabilidad.

## 📋 Características

- **Gestión de Camiones**: CRUD completo, documentación, historial
- **Gestión de Choferes**: Asignaciones, datos personales, documentación
- **Viajes**: Registro con rutas en mapa, cálculo automático de distancias
- **Mantenimiento**: Registro de actividades, alertas, documentación
- **Salarios**: Base mensual + porcentaje de lo facturado
- **Dashboard**: KPIs y analítica de rentabilidad
- **Reportes**: Exportación a PDF/Excel

## 🛠️ Stack Tecnológico

- **Frontend**: React.js + Vite + TypeScript
- **Backend**: Node.js + NestJS + TypeScript
- **Base de Datos**: MySQL
- **UI Components**: Material-UI / TailwindCSS
- **Mapas**: Leaflet / Mapbox
- **Gráficas**: Chart.js / Apache ECharts

## 📁 Estructura del Proyecto

```
truck-manager/
├── backend/              # API NestJS
│   ├── src/
│   │   ├── modules/     # Módulos de negocio
│   │   ├── common/      # Utilidades compartidas
│   │   └── main.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/            # Aplicación React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
├── README.md
└── docker-compose.yml   # (Opcional para desarrollo)
```

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+
- MySQL 8.0+
- Git

### Instalación Backend
```bash
cd backend
npm install
npm run start:dev
```

### Instalación Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📦 Próximos Pasos

1. [ ] Configurar base de datos MySQL
2. [ ] Crear esquema de BD
3. [ ] Implementar autenticación JWT
4. [ ] Crear módulos backend (Camiones, Choferes, Viajes, etc.)
5. [ ] Crear interfaces frontend
6. [ ] Integración con mapas
7. [ ] Sistema de reportes

## 👨‍💻 Contribuidores

- [jlombardo-17](https://github.com/jlombardo-17)

## 📄 Licencia

MIT
