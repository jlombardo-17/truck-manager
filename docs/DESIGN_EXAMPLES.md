# 🎨 TRUCK MANAGER DESIGN - EJEMPLOS VISUALES

**Guía de Uso y Ejemplos Prácticos**

---

## 📌 1. Hero Section Ejemplos

### Ejemplo 1: Hero Completo (Dashboard)
```tsx
import HeroSection from '@/components/HeroSection';

<HeroSection
  subtitle="Welcome to Truck Manager"
  title="Gestión Integral de Flota Vehicular"
  description="Controla, monitorea y optimiza tu flota de vehículos comerciales desde una única plataforma inteligente"
  features={[
    {
      title: 'Monitoreo en Tiempo Real',
      description: 'GPS en vivo de todos tus camiones, posición exacta cada segundo'
    },
    {
      title: 'Reportes Avanzados',
      description: 'Análisis detallado de rendimiento, combustible y mantenimiento'
    },
    {
      title: 'Gestión Eficiente',
      description: 'Optimiza rutas, reduce costos y mejora la productividad de tu flota'
    }
  ]}
  primaryAction={{
    label: 'Explorar Dashboard',
    onClick: () => navigate('/dashboard')
  }}
  secondaryAction={{
    label: 'Ver Documentación',
    onClick: () => window.open('/docs')
  }}
  image={{
    src: '/images/dashboard-mockup.png',
    alt: 'Dashboard Overview'
  }}
  darkBg={true}
/>
```

**Resultado Visual:**
```
┌─────────────────────────────────────────────────────────┐
│ WELCOME TO TRUCK MANAGER                                │
│ ═════════════════════════════════════════════════════════│
│                                             ┌─────────────┤
│ Gestión Integral de Flota Vehicular        │  Dashboard  │
│                                             │   Mockup    │
│ Controla, monitorea y optimiza...          │   Image     │
│                                             │             │
│ ✓ Monitoreo en Tiempo Real                │             │
│   GPS en vivo de todos tus camiones       │             │
│                                            │             │
│ ✓ Reportes Avanzados                       │             │
│   Análisis detallado de rendimiento       │             │
│                                            │             │
│ ✓ Gestión Eficiente                        │             │
│   Optimiza rutas, reduce costos           │             │
│                                            │             │
│ [Explorar Dashboard]  [Ver Documentación] │             │
└─────────────────────────────────────────────────────────┘
```

---

### Ejemplo 2: Hero Minimalista (Viajes)
```tsx
<HeroSection
  title="Planificación y Seguimiento de Viajes"
  description="Gestiona cada viaje con herramientas de optimización de rutas y monitoreo activo"
  primaryAction={{
    label: 'Crear Nuevo Viaje',
    onClick: handleCreateNew
  }}
  darkBg={true}
/>
```

**Resultado Visual:**
```
┌─────────────────────────────────────────┐
│ Planificación y Seguimiento de Viajes  │
│ ═══════════════════════════════════════│
│                                         │
│ Gestiona cada viaje con herramientas   │
│ de optimización de rutas y monitoreo   │
│ activo                                  │
│                                         │
│ [Crear Nuevo Viaje]                    │
└─────────────────────────────────────────┘
```

---

### Ejemplo 3: Hero Light (Reportes)
```tsx
<HeroSection
  subtitle="Analytics Hub"
  title="Reportes y Análisis"
  features={[
    {
      title: 'Data-Driven Insights',
      description: 'Toma decisiones basadas en datos reales'
    },
    {
      title: 'Custom Reports',
      description: 'Genera reportes personalizados según tus necesidades'
    }
  ]}
  darkBg={false}  // Light background
/>
```

---

## 📊 2. StatsGrid Ejemplos

### Ejemplo 1: Grid de 4 Columnas (Dashboard Principal)
```tsx
import StatsGrid from '@/components/StatsGrid';

const dashboardStats = [
  {
    label: 'Total de Camiones',
    value: '42',
    unit: 'unidades',
    icon: '🚚',
    color: 'blue' as const,
    trend: {
      direction: 'up' as const,
      percentage: 12
    }
  },
  {
    label: 'Viajes Este Mes',
    value: '1,256',
    unit: 'viajes',
    icon: '📍',
    color: 'green' as const,
    trend: {
      direction: 'up' as const,
      percentage: 8
    }
  },
  {
    label: 'Choferes Activos',
    value: '28',
    unit: 'personas',
    icon: '👤',
    color: 'purple' as const,
    trend: {
      direction: 'stable' as const,
      percentage: 0
    }
  },
  {
    label: 'Ingresos',
    value: '$45,230',
    unit: 'USD',
    icon: '💵',
    color: 'yellow' as const,
    trend: {
      direction: 'up' as const,
      percentage: 15
    }
  }
];

<StatsGrid stats={dashboardStats} columns={4} />
```

**Resultado Visual:**
```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 🚚               │  │ 📍               │  │ 👤               │  │ 💵               │
│ Total Camiones   │  │ Viajes Este Mes  │  │ Choferes Activos │  │ Ingresos         │
│ 42 unidades      │  │ 1,256 viajes     │  │ 28 personas      │  │ $45,230 USD      │
│ ↑ 12% ↑          │  │ ↑ 8% ↑           │  │ → 0% ↑           │  │ ↑ 15% ↑          │
└──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

### Ejemplo 2: Grid de 3 Columnas (Page Específica)
```tsx
const mantenimientoStats = [
  {
    label: 'Servicios Pendientes',
    value: '8',
    icon: '🔧',
    color: 'red' as const
  },
  {
    label: 'Último Servicio',
    value: '12 días',
    icon: '📅',
    color: 'yellow' as const
  },
  {
    label: 'Próximo Mantenimiento',
    value: '18 días',
    icon: '⏰',
    color: 'blue' as const
  }
];

<StatsGrid stats={mantenimientoStats} columns={3} />
```

---

### Ejemplo 3: Grid Responsivo (Auto-ajusta)
```tsx
<StatsGrid
  stats={stats}
  columns={4}  // En desktop: 4 columnas
              // En tablet (768px): 2 columnas
              // En mobile: 1 columna
/>
```

---

## 🎯 3. Combinación Hero + Stats (Dashboard Completo)

```tsx
import HeroSection from '@/components/HeroSection';
import StatsGrid from '@/components/StatsGrid';

export default function Dashboard() {
  const stats = [...]; // como arriba
  
  return (
    <main>
      {/* Hero Section */}
      <HeroSection
        subtitle="Welcome back"
        title="Dashboard - Truck Manager"
        description="Tu plataforma integral para gestión de flota en tiempo real"
        darkBg={true}
      />

      {/* Stats Section */}
      <section className="dashboard-stats">
        <div className="container">
          <h2>Resumen General</h2>
          <StatsGrid stats={stats} columns={4} />
        </div>
      </section>

      {/* Charts Section */}
      <section className="dashboard-charts">
        <div className="container">
          <h2>Análisis Detallado</h2>
          {/* Charts aquí */}
        </div>
      </section>

      {/* Tables Section */}
      <section className="dashboard-tables">
        <div className="container">
          <h2>Actividad Reciente</h2>
          {/* Tables aquí */}
        </div>
      </section>
    </main>
  );
}
```

**Estructura Visual:**
```
┌─────────────────────────────────────────────────────────────┐
│  HERO SECTION (Navy Background)                             │
│  Dashboard - Truck Manager                                  │
│  Tu plataforma integral para gestión de flota...            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ RESUMEN GENERAL                                             │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐│
│ │   42       │ │  1,256     │ │    28      │ │  $45,230   ││
│ │ CAMIONES   │ │   VIAJES   │ │  CHOFERES  │ │  INGRESOS  ││
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ANÁLISIS DETALLADO                                          │
│ [Gráficos y Charts aquí]                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ACTIVIDAD RECIENTE                                          │
│ [Tabla con últimas acciones]                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 4. Color Schemes para Diferentes Contextos

### Para KPIs (Key Performance Indicators)
```tsx
const kpiStats = [
  // Positivo: Verde
  { label: 'Ocupación Flota', value: '89%', color: 'green' },
  
  // Atención: Amarillo
  { label: 'Combustible Bajo', value: '3 camiones', color: 'yellow' },
  
  // Crítico: Rojo
  { label: 'Mantenimiento Pendiente', value: '5 vehículos', color: 'red' },
  
  // Info: Azul
  { label: 'Promedio Velocidad', value: '72 km/h', color: 'blue' }
];
```

### Para Métricas Financieras
```tsx
const financialStats = [
  { label: 'Ingresos', value: '$45K', color: 'green' },
  { label: 'Gastos', value: '$12.5K', color: 'red' },
  { label: 'Ganancia', value: '$32.5K', color: 'blue' },
  { label: 'Proyección', value: '$150K', color: 'purple' }
];
```

---

## 📱 5. Responsive Behavior

### En Desktop (1440px)
```
┌────────────────────────────────────────┐
│ [Stat1] [Stat2] [Stat3] [Stat4]       │
│ (4 columnas)                           │
└────────────────────────────────────────┘
```

### En Tablet (768px)
```
┌────────────────────────────────────────┐
│ [Stat1] [Stat2]                        │
│ [Stat3] [Stat4]                        │
│ (2 columnas)                           │
└────────────────────────────────────────┘
```

### En Mobile (375px)
```
┌────────────────────────────────────────┐
│ [Stat1]                                │
│ [Stat2]                                │
│ [Stat3]                                │
│ [Stat4]                                │
│ (1 columna)                            │
└────────────────────────────────────────┘
```

---

## 🚀 6. Ejemplos por Página

### Camiones.tsx
```tsx
const caminoesStats = [
  { label: 'Total Camiones', value: '42', color: 'blue' },
  { label: 'En Ruta', value: '28', color: 'green' },
  { label: 'En Mantenimiento', value: '5', color: 'yellow' },
  { label: 'Disponibles', value: '9', color: 'blue' }
];

<>
  <HeroSection {...heroProps} />
  <StatsGrid stats={caminoesStats} columns={4} />
  <CamionesTable />
</>
```

### Choferes.tsx
```tsx
const chofersStats = [
  { label: 'Total Choferes', value: '28', color: 'blue' },
  { label: 'En Servicio', value: '24', color: 'green' },
  { label: 'Documentos Vencidos', value: '2', color: 'red' },
  { label: 'Nuevos Este Mes', value: '3', color: 'yellow' }
];
```

### Viajes.tsx
```tsx
const viajesStats = [
  { label: 'Viajes Totales', value: '1,256', color: 'blue' },
  { label: 'Completados', value: '1,200', color: 'green' },
  { label: 'En Progreso', value: '45', color: 'yellow' },
  { label: 'Cancelados', value: '11', color: 'red' }
];
```

---

## 🎯 7. CSS Classes Útiles

```html
<!-- Text utilities -->
<p class="text-xl text-bold">Título grande</p>
<p class="text-lg text-semibold text-secondary">Subtítulo</p>
<p class="text-sm text-muted">Texto pequeño</p>

<!-- Color utilities -->
<span class="text-primary">Texto principal</span>
<span class="text-secondary">Texto secundario</span>
<span class="text-white">Texto blanco</span>

<!-- Card layouts -->
<div class="table-container">
  <table class="camiones-table">...</table>
</div>

<div class="chart-container">
  <canvas>...</canvas>
</div>
```

---

## ✨ Animaciones Disponibles

Todos los componentes incluyen:
- Hover effects (lift + shadow)
- Smooth transitions (0.3s)
- Loading skeletons
- Focus states

---

## 📚 Referencias

- [HeroSection Component](./frontend/src/components/HeroSection.tsx)
- [StatsGrid Component](./frontend/src/components/StatsGrid.tsx)
- [CSS Variables](./frontend/src/index.css#:root)
- [Design Analysis](./GEOTAB_DESIGN_ANALYSIS.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)

---

## 🎉 ¡Lista para Implementar!

Copia y pega estos ejemplos en tus páginas para obtener inmediatamente:
✅ Diseño profesional  
✅ Componentes reutilizables  
✅ Responsive automático  
✅ Animaciones suaves  
✅ Colores coherentes  

