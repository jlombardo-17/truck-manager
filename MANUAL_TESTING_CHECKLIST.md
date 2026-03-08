# 🧪 Manual Testing Checklist - Truck Manager

**Versión**: 1.0  
**Fecha**: Marzo 8, 2026  
**Última Actualización**: Implementación de Sprint 11 (Salarios)

---

## 📋 Instrucciones Generales

### Antes de Empezar
1. ✅ Backend corriendo en `http://localhost:3000`
2. ✅ Frontend corriendo en `http://localhost:5173`
3. ✅ Base de datos PostgreSQL conectada
4. ✅ Datos de prueba cargados (usar scripts create_*_test_data.ps1)

### Navegadores a Probar
- [ ] Google Chrome (última versión)
- [ ] Firefox (opcional)
- [ ] Microsoft Edge (opcional)

### Resoluciones a Probar
- [ ] Desktop: 1920x1080 (Full HD)
- [ ] Tablet: 768x1024 (iPad)
- [ ] Mobile: 375x667 (iPhone)

### Herramientas de Accesibilidad
- [ ] Lighthouse (Chrome DevTools)
- [ ] axe DevTools (extensión)
- [ ] Keyboard Navigation (Tab, Enter, Esc)

---

## 🔐 Sección 1: Autenticación y Sesión

### Test 1.1: Login Exitoso
**Pasos:**
1. Ir a `http://localhost:5173/login`
2. Ingresar credenciales válidas (email: usuario@test.com, password: test123)
3. Click en "Iniciar Sesión"

**Resultado Esperado:**
- ✅ Redirección automática a `/dashboard`
- ✅ Token guardado en localStorage
- ✅ No hay errores en consola
- ✅ Menú de navegación visible

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 1.2: Login con Credenciales Incorrectas
**Pasos:**
1. Ingresar email o password incorrecto
2. Click en "Iniciar Sesión"

**Resultado Esperado:**
- ✅ Mensaje de error visible: "Credenciales inválidas"
- ✅ No redirige
- ✅ Campos permanecen completados

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 1.3: Logout
**Pasos:**
1. Estando logueado, hacer click en "Cerrar Sesión"

**Resultado Esperado:**
- ✅ Redirección a `/login`
- ✅ Token eliminado de localStorage
- ✅ No puede acceder a rutas protegidas sin login

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 1.4: Protección de Rutas
**Pasos:**
1. Sin estar logueado, intentar acceder a `/dashboard`, `/camiones`, `/choferes`

**Resultado Esperado:**
- ✅ Redirección automática a `/login`
- ✅ Mensaje de "Debe iniciar sesión"

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

## 🚚 Sección 2: Gestión de Camiones

### Test 2.1: Listar Camiones
**Pasos:**
1. Ir a `/camiones`
2. Observar la tabla de camiones

**Resultado Esperado:**
- ✅ Tabla muestra patente, marca, modelo, año, estado
- ✅ Botones de Ver, Editar, Eliminar visibles
- ✅ Búsqueda por patente funciona
- ✅ Filtro por estado funciona (Disponible, En Ruta, En Mantenimiento)
- ✅ Paginación funciona si hay más de 10 registros

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 2.2: Crear Nuevo Camión
**Pasos:**
1. Click en "Nuevo Camión"
2. Completar formulario:
   - Patente: ABC123
   - Marca: Volvo
   - Modelo: FH16
   - Año: 2023
   - Tipo Carrocería: Cama Baja
   - Capacidad Carga: 28000
   - Estado: Disponible
3. Click en "Guardar"

**Resultado Esperado:**
- ✅ Redirección a lista de camiones
- ✅ Mensaje de éxito visible
- ✅ Nuevo camión aparece en la lista
- ✅ Validaciones funcionan (campos requeridos con *)

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 2.3: Editar Camión Existente
**Pasos:**
1. Click en botón "Editar" (✏️) de un camión
2. Modificar algunos campos (ej: cambiar estado a "En Mantenimiento")
3. Click en "Guardar"

**Resultado Esperado:**
- ✅ Datos actualizados en la lista
- ✅ Mensaje de confirmación
- ✅ Cambios reflejados en detalle

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 2.4: Ver Detalle de Camión
**Pasos:**
1. Click en botón "Ver" (👁️) de un camión
2. Observar página de detalle

**Resultado Esperado:**
- ✅ Información del camión: patente, marca, modelo, año, capacidad
- ✅ Tabs: Información General, Mantenimiento
- ✅ Tab Mantenimiento muestra:
  - Tabla de mantenimientos (tipo, fecha, costo, notas)
  - Botón "Registrar Mantenimiento"
  - Estadísticas de mantenimiento
- ✅ Botón "Volver" funciona

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 2.5: Registrar Mantenimiento
**Pasos:**
1. En detalle de camión, ir a tab "Mantenimiento"
2. Click en "Registrar Mantenimiento"
3. Completar formulario:
   - Tipo: Correctivo
   - Fecha: [Hoy]
   - Costo: 150000
   - Proveedor: Taller ABC
   - Notas: Cambio de aceite
4. Guardar

**Resultado Esperado:**
- ✅ Nuevo registro aparece en tabla de mantenimiento
- ✅ Estadísticas se actualizan (total gastado, último mantenimiento)
- ✅ Modal se cierra

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 2.6: Eliminar Camión
**Pasos:**
1. Click en botón "Eliminar" (🗑️) de un camión
2. Confirmar eliminación en el modal

**Resultado Esperado:**
- ✅ Modal de confirmación aparece
- ✅ Camión desaparece de la lista
- ✅ Mensaje de éxito
- ✅ Si cancela, no elimina

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

## 👷 Sección 3: Gestión de Choferes

### Test 3.1: Listar Choferes
**Pasos:**
1. Ir a `/choferes`
2. Observar tabla de choferes

**Resultado Esperado:**
- ✅ Tabla muestra nombre, apellido, RUT, teléfono, estado
- ✅ Filtros por estado funcionan (Activo, Inactivo, Licencia)
- ✅ Búsqueda por nombre funciona
- ✅ Botones Ver, Editar, Eliminar visibles con ARIA labels

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 3.2: Crear Nuevo Chofer
**Pasos:**
1. Click en "Nuevo Chofer"
2. Completar formulario:
   - RUT: 12345678-9
   - Nombre: Juan
   - Apellido: Pérez
   - Teléfono: +56912345678
   - Dirección: Calle Falsa 123
   - Fecha Ingreso: [Hoy]
   - Fecha Nacimiento: 1990-01-01
   - Sueldo Base: 800000
   - % Comisión: 10
   - Estado: Activo
3. Guardar

**Resultado Esperado:**
- ✅ Redirección a lista de choferes
- ✅ Nuevo chofer visible en lista
- ✅ Validaciones de campos funcionan

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 3.3: Ver Detalle de Chofer
**Pasos:**
1. Click en "Ver" de un chofer
2. Observar página de detalle

**Resultado Esperado:**
- ✅ Información personal: nombre, RUT, teléfono, dirección
- ✅ Información laboral: fecha ingreso, sueldo base, % comisión, estado
- ✅ Sección de Documentos con tabla (tipo, número, fecha emisión, fecha expiración, estado)
- ✅ Botones: "Volver a Choferes", "Ver Salarios", "Editar"

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 3.4: Gestión de Documentos del Chofer
**Pasos:**
1. En detalle del chofer, ir a sección "Documentos"
2. Click en "Agregar Documento"
3. Completar:
   - Tipo: Licencia de Conducir
   - Número: L123456
   - Fecha Emisión: 2023-01-01
   - Fecha Expiración: 2028-01-01
4. Guardar

**Resultado Esperado:**
- ✅ Documento aparece en tabla
- ✅ Estado automático: "Vigente" si no expiró, "Por Vencer" si faltan <30 días, "Vencido" si expiró
- ✅ Badge de estado con colores WCAG AA
- ✅ Puede editar y eliminar documentos

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 3.5: Ver Salarios del Chofer
**Pasos:**
1. En detalle del chofer, click en "Ver Salarios" (botón verde 💰)
2. Observar página de salarios

**Resultado Esperado:**
- ✅ Header muestra nombre del chofer y RUT
- ✅ Filtros de Año y Estado funcionan
- ✅ Tabla muestra: Período, Salario Base, Comisiones, Bonos, Deducciones, Salario Neto, Estado, Fecha Pago
- ✅ Fila de totales al final de la tabla
- ✅ Botones Ver Detalle (👁️) y Generar PDF (📄)
- ✅ Si no hay salarios: mensaje "No hay salarios registrados para este período"

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 3.6: Ver Detalle de Salario
**Pasos:**
1. En página de salarios, click en Ver Detalle de un salario
2. Observar página de detalle

**Resultado Esperado:**
- ✅ Resumen de liquidación: Base + Comisiones + Bonos - Deducciones = Salario Neto
- ✅ Cards con colores: Verde (comisiones), Azul (bonos), Rojo (deducciones), Azul oscuro (neto)
- ✅ Badge de estado con color correcto (Pendiente: naranja, Pagado: verde, Cancelado: rojo)
- ✅ Sección "Viajes del Período" muestra:
   - Cards de cada viaje con número, fecha, ruta, valor viaje, comisión
   - Detalle de comisiones si existen
- ✅ Botón "Generar PDF" visible

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 3.7: Generar Recibo PDF de Salario
**Pasos:**
1. En detalle de salario, click en "📄 Generar PDF"

**Resultado Esperado:**
- ✅ Se descarga archivo PDF con formato: `Liquidacion_[Apellido]_[Periodo].pdf`
- ✅ PDF contiene:
   - Título: "LIQUIDACIÓN DE SUELDO"
   - Período y nombre del chofer
   - Información del chofer (nombre, RUT, teléfono)
   - Tabla de resumen (Base, Comisiones, Bonos, Deducciones, Neto)
   - Tabla de viajes (N° Viaje, Fecha, Ruta, Valor, Comisión)
   - Estado de pago y método
   - Líneas para firmas (Empleador y Trabajador)
- ✅ Formato legible y profesional

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

## 🚗 Sección 4: Gestión de Viajes

### Test 4.1: Listar Viajes
**Pasos:**
1. Ir a `/viajes`
2. Observar tabla de viajes

**Resultado Esperado:**
- ✅ Tabla muestra: N° Viaje, Fecha, Camión (patente), Chofer, Origen, Destino, Estado, Valor
- ✅ Filtros funcionan: Estado (Planificado, En Curso, Completado, Cancelado)
- ✅ Búsqueda por número de viaje funciona
- ✅ Botones Editar y Eliminar visibles con ARIA labels

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 4.2: Crear Nuevo Viaje
**Pasos:**
1. Click en "Nuevo Viaje"
2. Completar formulario:
   - Número Viaje: V-2026-001
   - Camión: [Seleccionar uno]
   - Chofer: [Seleccionar uno]
   - Cliente: Cliente ABC
   - Origen: Santiago
   - Destino: Valparaíso
   - Fecha Inicio: [Hoy]
   - Fecha Fin Estimada: [Mañana]
   - Valor Viaje: 500000
   - Tipo Carga: Carga General
   - Peso Carga: 15000
   - Estado: Planificado
3. Guardar

**Resultado Esperado:**
- ✅ Redirección a lista de viajes
- ✅ Nuevo viaje visible
- ✅ Validaciones de campos obligatorios funcionan
- ✅ Select de camión solo muestra camiones disponibles
- ✅ Select de chofer solo muestra choferes activos

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 4.3: Editar Viaje con Editor de Mapa
**Pasos:**
1. Click en Editar viaje
2. En el formulario, agregar/editar ruta en el mapa:
   - Click en puntos del mapa para crear ruta
   - Agregar waypoints intermedios
3. Guardar

**Resultado Esperado:**
- ✅ Mapa de Leaflet se carga correctamente
- ✅ Puede marcar puntos de origen y destino
- ✅ Puede agregar waypoints intermedios
- ✅ Línea de ruta se dibuja automáticamente
- ✅ Al guardar, ruta se almacena (coordenadas y distancia)

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 4.4: Cambiar Estado de Viaje
**Pasos:**
1. Editar un viaje con estado "Planificado"
2. Cambiar estado a "En Curso"
3. Guardar y volver a editar
4. Cambiar estado a "Completado"

**Resultado Esperado:**
- ✅ Estado se actualiza correctamente
- ✅ Color del badge cambia según estado
- ✅ Al completar viaje, comisiones se calculan automáticamente (si aplica)

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 4.5: Eliminar Viaje
**Pasos:**
1. Click en Eliminar de un viaje
2. Confirmar en modal

**Resultado Esperado:**
- ✅ Modal de confirmación aparece
- ✅ Viaje desaparece de la lista
- ✅ Si cancela, no elimina

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

## 📊 Sección 5: Reportes

### Test 5.1: Acceso a Reportes
**Pasos:**
1. Ir a `/reportes`

**Resultado Esperado:**
- ✅ Página carga sin errores
- ✅ Tiene filtros de fecha, camiones, choferes
- ✅ Opciones de rango de fecha: Hoy, Esta Semana, Este Mes, Este Año, Personalizado
- ✅ Selector de columnas con 9 opciones

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 5.2: Filtros de Fecha
**Pasos:**
1. Seleccionar "Este Mes"
2. Click en "Generar Reporte"

**Resultado Esperado:**
- ✅ Reporte muestra solo datos del mes actual
- ✅ 4 tablas visibles:
   - Resumen General (ingresos, gastos, ganancia neta)
   - Detalle por Camión
   - Comparativa de Períodos
   - Operaciones (viajes, km, gastos operativos)

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 5.3: Multi-Select de Camiones y Choferes
**Pasos:**
1. Seleccionar 2 camiones específicos (multi-select)
2. Seleccionar 1 chofer específico
3. Generar reporte

**Resultado Esperado:**
- ✅ Reporte filtra solo esos camiones y ese chofer
- ✅ Detalle muestra solo los seleccionados
- ✅ Si no selecciona ninguno (vacío), trae todos

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 5.4: Selector de Columnas
**Pasos:**
1. Desmarcar algunas columnas (ej: Mantenimiento, Sueldo Chofer)
2. Generar reporte

**Resultado Esperado:**
- ✅ Tablas muestran solo columnas seleccionadas
- ✅ Validación: no permite desmarcar todas (mínimo 1)
- ✅ PDF y CSV respetan la selección

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 5.5: Exportar PDF
**Pasos:**
1. Generar reporte con datos de prueba
2. Click en "Exportar PDF"

**Resultado Esperado:**
- ✅ Se descarga archivo PDF
- ✅ PDF contiene las 4 tablas:
   - Resumen General
   - Detalle por Camión
   - Comparativa de Períodos
   - Operaciones
- ✅ Respeta columnas seleccionadas
- ✅ Formato legible

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 5.6: Exportar CSV
**Pasos:**
1. Generar reporte
2. Click en "Exportar CSV"

**Resultado Esperado:**
- ✅ Se descarga archivo .csv
- ✅ Contiene headers correctos
- ✅ Datos separados por coma
- ✅ Se abre correctamente en Excel/Google Sheets

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

## 🏠 Sección 6: Dashboard

### Test 6.1: Cargar Dashboard
**Pasos:**
1. Ir a `/dashboard`

**Resultado Esperado:**
- ✅ StatsGrid muestra 4 cards:
   - Total Camiones (con icono 🚚)
   - Camiones Activos
   - Total Choferes (con icono 👷)
   - Viajes Completados
- ✅ Números correctos según datos de prueba
- ✅ Cards con gradiente azul
- ✅ Sin errores en consola

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 6.2: Tabla de Viajes Recientes
**Pasos:**
1. Scroll hacia abajo en dashboard

**Resultado Esperado:**
- ✅ Tabla muestra últimos 5-10 viajes
- ✅ Columnas: N° Viaje, Fecha, Chofer, Ruta, Estado
- ✅ Badges de estado con colores correctos
- ✅ Sin datos repetidos

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

## ♿ Sección 7: Accesibilidad (WCAG AA)

### Test 7.1: Navegación con Teclado
**Pasos:**
1. En cualquier página, presionar Tab repetidamente
2. Navegar por todos los elementos interactivos

**Resultado Esperado:**
- ✅ Orden de foco lógico (de arriba hacia abajo, izquierda a derecha)
- ✅ Foco visible con outline azul de 2px (#2563eb)
- ✅ Todos los botones, links, inputs son alcanzables
- ✅ Puede activar botones con Enter o Space
- ✅ Modales se pueden cerrar con Esc

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 7.2: ARIA Labels en Botones de Acción
**Pasos:**
1. Ir a lista de camiones, choferes o viajes
2. Inspeccionar botones de Ver, Editar, Eliminar

**Resultado Esperado:**
- ✅ Cada botón tiene aria-label descriptivo completo:
   - "Ver detalle de camión ABC123"
   - "Editar información de Juan Pérez"
   - "Eliminar viaje V-2026-001: Santiago - Valparaíso"
- ✅ Screen reader lee el contexto completo

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 7.3: Contraste de Colores
**Pasos:**
1. Usar axe DevTools o Color Contrast Analyzer
2. Verificar badges de estado (Success, Warning, Danger, Neutral)

**Resultado Esperado:**
- ✅ Success: #155724 sobre #D4EDDA (7.43:1) ✅
- ✅ Warning: #856404 sobre #FFF3CD (6.50:1) ✅
- ✅ Danger: #721C24 sobre #F8D7DA (8.90:1) ✅
- ✅ Neutral: #383D41 sobre #E2E3E5 (10.72:1) ✅
- ✅ Todos >= 4.5:1 (WCAG AA)

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 7.4: Formularios Accesibles
**Pasos:**
1. Abrir formulario de crear camión o chofer
2. Inspeccionar inputs en Chrome DevTools

**Resultado Esperado:**
- ✅ Cada input tiene `aria-describedby` apuntando a help text
- ✅ Campos requeridos tienen `aria-required="true"`
- ✅ Help text visible debajo del input con id único
- ✅ Help text cambia de color al enfocar input (#2563eb)

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 7.5: Lighthouse Audit
**Pasos:**
1. Abrir Chrome DevTools > Lighthouse
2. Seleccionar "Accessibility" + "Desktop"
3. Generar reporte

**Resultado Esperado:**
- ✅ Score de Accesibilidad: >= 90
- ✅ 0 errores críticos
- ✅ Advertencias menores aceptables

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 7.6: Screen Reader (NVDA - Opcional)
**Pasos:**
1. Descargar NVDA (https://www.nvaccess.org/)
2. Navegar por la aplicación con NVDA activado

**Resultado Esperado:**
- ✅ Elementos se anuncian correctamente
- ✅ Botones con ARIA labels se leen con contexto completo
- ✅ Formularios se leen con labels y help text
- ✅ Tablas anuncian headers correctamente

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 7.7: Reduced Motion
**Pasos:**
1. En Windows: Settings > Accessibility > Visual effects > Animation effects OFF
2. Recargar aplicación

**Resultado Esperado:**
- ✅ Animaciones se reducen a 0.01ms
- ✅ Transiciones instantáneas
- ✅ Aplicación sigue funcional

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

## 📱 Sección 8: Responsive Design

### Test 8.1: Vista Desktop (1920x1080)
**Pasos:**
1. Abrir DevTools, viewport 1920x1080
2. Navegar por todas las páginas

**Resultado Esperado:**
- ✅ Tablas se ven completas sin scroll horizontal
- ✅ Formularios centrados con max-width
- ✅ Cards de dashboard en grid de 4 columnas
- ✅ Sin elementos cortados

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 8.2: Vista Tablet (768x1024)
**Pasos:**
1. Cambiar viewport a 768px ancho
2. Navegar por todas las páginas

**Resultado Esperado:**
- ✅ Tablas con scroll horizontal si es necesario
- ✅ Filtros apilados verticalmente
- ✅ Cards de dashboard en 2 columnas
- ✅ Botones no se superponen

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 8.3: Vista Mobile (375x667)
**Pasos:**
1. Cambiar viewport a 375px ancho (iPhone)
2. Navegar por todas las páginas

**Resultado Esperado:**
- ✅ Menú hamburguesa funcional
- ✅ Tablas con scroll horizontal
- ✅ Formularios a 1 columna
- ✅ Botones de acción apilados verticalmente
- ✅ Cards de dashboard a 1 columna
- ✅ Texto legible sin zoom

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

## 🔍 Sección 9: Performance

### Test 9.1: Lighthouse Performance
**Pasos:**
1. Lighthouse > Performance > Desktop
2. Generar reporte

**Resultado Esperado:**
- ✅ Score: >= 70
- ✅ First Contentful Paint: < 2s
- ✅ Largest Contentful Paint: < 3s
- ✅ Time to Interactive: < 4s

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 9.2: Tamaño de Bundle
**Pasos:**
1. npm run build en frontend
2. Observar output de Vite

**Resultado Esperado:**
- ✅ index.css: ~100 kB (gzip ~22 kB)
- ✅ index.js: ~1.1 MB (gzip ~346 kB)
- ✅ Advertencia de chunks > 500kB es aceptable
- ✅ Build completo en < 10s

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 9.3: Tiempos de Respuesta API
**Pasos:**
1. Abrir Network tab en DevTools
2. Navegar y observar tiempos de requests

**Resultado Esperado:**
- ✅ GET /api/camiones: < 500ms
- ✅ GET /api/choferes: < 500ms
- ✅ GET /api/viajes: < 500ms
- ✅ GET /api/reportes/rentabilidad: < 2s
- ✅ POST requests: < 1s

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

## 🐛 Sección 10: Manejo de Errores

### Test 10.1: Error de Conexión Backend
**Pasos:**
1. Detener backend (Ctrl+C en terminal)
2. Intentar crear/editar algo en frontend

**Resultado Esperado:**
- ✅ Mensaje de error: "Error de conexión con el servidor"
- ✅ No crash de la aplicación
- ✅ Puede volver a intentar

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 10.2: Validación de Campos
**Pasos:**
1. Intentar crear camión con patente vacía
2. Intentar crear chofer con RUT inválido

**Resultado Esperado:**
- ✅ Mensaje de error visible debajo del campo
- ✅ Botón de guardar deshabilitado si hay errores
- ✅ No se envía request al backend

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

### Test 10.3: Datos No Encontrados
**Pasos:**
1. Manualmente ir a URL `/camiones/99999` (ID inexistente)

**Resultado Esperado:**
- ✅ Mensaje: "Camión no encontrado"
- ✅ Botón para volver a lista
- ✅ No crash

**Estado:** [ ] PASS / [ ] FAIL  
**Notas:** _______________

---

## ✅ Resumen Final

### Estadísticas de Testing
- **Total de Tests**: 55
- **Aprobados (PASS)**: ___ / 55
- **Fallidos (FAIL)**: ___ / 55
- **Porcentaje de Éxito**: ____%

### Problemas Críticos Encontrados
1. _______________
2. _______________
3. _______________

### Problemas Menores Encontrados
1. _______________
2. _______________
3. _______________

### Mejoras Sugeridas
1. _______________
2. _______________
3. _______________

---

## 📞 Soporte

Si encuentras algún bug o tienes sugerencias:
1. Anota el test que falló
2. Captura screenshot si es visual
3. Copia el error de consola (F12 > Console)
4. Describe los pasos para reproducir

---

**✨ Happy Testing!**
