# 📡 API Endpoints - Truck Manager

## Base URL
```
http://localhost:3000/api
```

## Autenticación
Todos los endpoints (excepto `/auth/login` y `/auth/register`) requieren un token JWT en el header:
```
Authorization: Bearer <token>
```

---

## 🔐 Autenticación (`/auth`)

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@truckmanager.local",
  "password": "admin123"
}

Response (200):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@truckmanager.local",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }
}
```

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "nuevo@truckmanager.local",
  "password": "password123",
  "firstName": "Juan",
  "lastName": "Pérez"
}

Response (201):
{
  "access_token": "...",
  "user": { ... }
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>

Response (200):
{
  "id": 1,
  "email": "admin@truckmanager.local",
  "firstName": "Admin",
  "lastName": "User",
  "role": "admin"
}
```

---

## 🚛 Camiones (`/camiones`)

### Listar Camiones
```http
GET /camiones
Authorization: Bearer <token>

Response (200):
[
  {
    "id": 1,
    "patente": "TM123AA",
    "marca": "Volvo",
    "modelo": "FH16",
    "anio": 2020,
    "vin": "VV...",
    "color": "Blanco",
    "tipoVehiculo": "Camión",
    "capacidadCargaKg": 25000,
    "odometroKm": 150000,
    "estado": "activo",
    "fechaAdquisicion": "2020-01-15",
    "usuarioId": 1,
    "createdAt": "2026-03-04T10:30:00Z",
    "updatedAt": "2026-03-07T15:45:00Z"
  }
]
```

### Obtener Camión por ID
```http
GET /camiones/:id
Authorization: Bearer <token>

Response (200):
{ ... camión object ... }
```

### Crear Camión
```http
POST /camiones
Authorization: Bearer <token>
Content-Type: application/json

{
  "patente": "TM456BB",
  "marca": "Scania",
  "modelo": "R450",
  "anio": 2021,
  "vin": "SC...",
  "color": "Rojo",
  "tipoVehiculo": "Gandola",
  "capacidadCargaKg": 30000,
  "odometroKm": 0,
  "estado": "activo",
  "fechaAdquisicion": "2021-06-20"
}

Response (201):
{ ... camión creado ... }
```

### Actualizar Camión
```http
PATCH /camiones/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "odometroKm": 155000,
  "estado": "mantenimiento"
}

Response (200):
{ ... camión actualizado ... }
```

### Eliminar Camión
```http
DELETE /camiones/:id
Authorization: Bearer <token>

Response (200):
{
  "message": "Camión eliminado exitosamente"
}
```

---

## 📄 Documentos de Camión (`/camiones/:id/documentos`)

### Listar Documentos de Camión
```http
GET /camiones/:id/documentos
Authorization: Bearer <token>

Response (200):
[
  {
    "id": 1,
    "camionId": 1,
    "tipo": "seguro",
    "numeroDocumento": "SEG-2026-001",
    "archivoUrl": "/docs/seguro.pdf",
    "fechaEmision": "2026-01-01",
    "fechaVencimiento": "2027-01-01",
    "estado": "vigente",
    "notas": "Póliza completa",
    "createdAt": "2026-03-04T10:30:00Z"
  }
]
```

### Crear Documento
```http
POST /camiones/:id/documentos
Authorization: Bearer <token>
Content-Type: application/json

{
  "tipo": "verificacion",
  "numeroDocumento": "VER-2026-001",
  "fechaEmision": "2026-03-01",
  "fechaVencimiento": "2027-03-01",
  "notas": "RTV realizado"
}

Response (201):
{ ... documento creado ... }
```

### Actualizar Documento
```http
PATCH /camiones/:id/documentos/:docId
Authorization: Bearer <token>
Content-Type: application/json

{
  "estado": "vencido"
}

Response (200):
{ ... documento actualizado ... }
```

### Eliminar Documento
```http
DELETE /camiones/:id/documentos/:docId
Authorization: Bearer <token>

Response (200):
{ "message": "Documento eliminado" }
```

---

## 👨‍✈️ Choferes (`/choferes`)

### Listar Choferes
```http
GET /choferes
Authorization: Bearer <token>

Response (200):
[
  {
    "id": 1,
    "numeroDocumento": "12345678",
    "nombre": "Juan",
    "apellido": "García",
    "telefono": "+595971234567",
    "email": "juan@example.com",
    "fechaNacimiento": "1985-06-15",
    "direccion": "123 Calle Principal",
    "ciudad": "Asunción",
    "licenciaNumero": "LIC-001",
    "licenciaTipo": "C",
    "licenciaVencimiento": "2027-06-15",
    "sueldoBase": 3000000,
    "porcentajeComision": 5.5,
    "estado": "activo",
    "createdAt": "2026-03-04T10:30:00Z"
  }
]
```

### Obtener Chofer por ID
```http
GET /choferes/:id
Authorization: Bearer <token>

Response (200):
{ ... chofer object ... }
```

### Crear Chofer
```http
POST /choferes
Authorization: Bearer <token>
Content-Type: application/json

{
  "numeroDocumento": "87654321",
  "nombre": "Carlos",
  "apellido": "López",
  "telefono": "+595972222222",
  "email": "carlos@example.com",
  "fechaNacimiento": "1990-08-20",
  "direccion": "456 Avenida Central",
  "ciudad": "Villarrica",
  "licenciaNumero": "LIC-002",
  "licenciaTipo": "C",
  "licenciaVencimiento": "2028-08-20",
  "sueldoBase": 3200000,
  "porcentajeComision": 6
}

Response (201):
{ ... chofer creado ... }
```

### Actualizar Chofer
```http
PUT /choferes/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "estado": "licencia",
  "sueldoBase": 3300000
}

Response (200):
{ ... chofer actualizado ... }
```

### Eliminar Chofer
```http
DELETE /choferes/:id
Authorization: Bearer <token>

Response (200):
{ "message": "Chofer eliminado exitosamente" }
```

---

## 📄 Documentos de Chofer (`/choferes/:id/documentos`)

### Listar Documentos de Chofer
```http
GET /choferes/:id/documentos
Authorization: Bearer <token>

Response (200):
[
  {
    "id": 1,
    "choferId": 1,
    "tipo": "licencia_conducir",
    "archivoUrl": "/docs/licencia.pdf",
    "fechaEmision": "2023-06-15",
    "fechaVencimiento": "2028-06-15",
    "estado": "vigente",
    "notas": "Categoría C"
  }
]
```

### Crear Documento
```http
POST /choferes/:id/documentos
Authorization: Bearer <token>
Content-Type: application/json

{
  "tipo": "antecedentes",
  "fechaEmision": "2026-03-01",
  "fechaVencimiento": "2029-03-01"
}

Response (201):
{ ... documento creado ... }
```

---

## 🚗 Viajes (`/viajes`)

### Listar Viajes (con filtros)
```http
GET /viajes?estado=en_progreso&camionId=1&choferId=1
Authorization: Bearer <token>

Response (200):
[
  {
    "id": 1,
    "numeroViaje": "VJ-2026-003741",
    "camionId": 1,
    "choferId": 1,
    "fechaInicio": "2026-03-07",
    "fechaFin": "2026-03-08",
    "origen": "Asunción",
    "destino": "Ciudad del Este",
    "descripcionCarga": "50 toneladas de papas",
    "valorViaje": 5000000,
    "kmRecorridos": 350,
    "estado": "completado",
    "notasChofer": "Sin incidentes",
    "createdAt": "2026-03-07T08:00:00Z"
  }
]
```

### Obtener Viaje por ID
```http
GET /viajes/:id
Authorization: Bearer <token>

Response (200):
{ ... viaje object ... }
```

### Crear Viaje
```http
POST /viajes
Authorization: Bearer <token>
Content-Type: application/json

{
  "numeroViaje": "VJ-2026-003742",
  "camionId": 1,
  "choferId": 1,
  "fechaInicio": "2026-03-08",
  "origen": "Asunción",
  "destino": "Encarnación",
  "descripcionCarga": "100 cajas de bebidas",
  "valorViaje": 4500000,
  "estado": "en_progreso"
}

Response (201):
{ ... viaje creado ... }
```

### Actualizar Viaje
```http
PATCH /viajes/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "estado": "completado",
  "fechaFin": "2026-03-08",
  "notasChofer": "Entrega exitosa"
}

Response (200):
{ ... viaje actualizado ... }
```

### Cambiar Estado de Viaje
```http
POST /viajes/:id/cambiar-estado
Authorization: Bearer <token>
Content-Type: application/json

{
  "estado": "cancelado"
}

Response (200):
{
  "id": 1,
  "estado": "cancelado",
  "motivoCancelacion": null
}
```

### Eliminar Viaje
```http
DELETE /viajes/:id
Authorization: Bearer <token>

Response (200):
{ "message": "Viaje eliminado" }
```

---

## 🗺️ Rutas de Viaje (`/viajes/:id/rutas`)

### Listar Rutas de un Viaje
```http
GET /viajes/:id/rutas
Authorization: Bearer <token>

Response (200):
[
  {
    "id": 1,
    "viajeId": 1,
    "orden": 1,
    "latitud": -25.2637,
    "longitud": -57.5759,
    "direccion": "Asunción, Paraguay",
    "odometroKm": 0,
    "notas": "Punto de salida"
  },
  {
    "id": 2,
    "viajeId": 1,
    "orden": 2,
    "latitud": -25.4095,
    "longitud": -57.4438,
    "direccion": "Villarrica, Paraguay",
    "odometroKm": 150,
    "notas": "Punto intermedio"
  }
]
```

### Guardar Rutas de un Viaje
```http
POST /viajes/:id/rutas
Authorization: Bearer <token>
Content-Type: application/json

{
  "rutas": [
    {
      "orden": 1,
      "latitud": -25.2637,
      "longitud": -57.5759,
      "direccion": "Asunción, Paraguay",
      "notas": "Punto de salida"
    },
    {
      "orden": 2,
      "latitud": -25.4095,
      "longitud": -57.4438,
      "direccion": "Villarrica, Paraguay",
      "odometroKm": 150,
      "notas": "Punto intermedio"
    },
    {
      "orden": 3,
      "latitud": -26.1843,
      "longitud": -55.4915,
      "direccion": "Encarnación, Paraguay",
      "odometroKm": 350,
      "notas": "Destino final"
    }
  ]
}

Response (200):
{ "message": "Rutas guardadas exitosamente", "kmRecorridos": 350 }
```

---

## 💰 Comisiones de Viaje (`/viajes/:id/comisiones`)

### Listar Comisiones de un Viaje
```http
GET /viajes/:id/comisiones
Authorization: Bearer <token>

Response (200):
[
  {
    "id": 1,
    "viajeId": 1,
    "tipo": "Contratista",
    "concepto": "Flete",
    "montoBase": 5000000,
    "porcentaje": 10,
    "montoTotal": 500000,
    "beneficiario": "Transportes XYZ",
    "estado": "pendiente"
  }
]
```

### Crear Comisión
```http
POST /viajes/:id/comisiones
Authorization: Bearer <token>
Content-Type: application/json

{
  "tipo": "Operario",
  "concepto": "Carga",
  "porcentaje": 5,
  "beneficiario": "Juan García"
}

Response (201):
{ ... comisión creada ... }
```

---

## 📊 Dashboard (`/dashboard`)

### Resumen General
```http
GET /dashboard/resumen
Authorization: Bearer <token>

Response (200):
{
  "ingresosDelMes": 50000000,
  "gastosDelMes": 15000000,
  "gananciaNetaDelMes": 35000000,
  "camionesActivos": 5,
  "viajesCompletados": 45,
  "mantenimientoPendiente": [
    {
      "camionPlaca": "TM123AA",
      "tipo": "Cambio de aceite",
      "proximoVencimiento": "2026-03-15"
    }
  ],
  "documentosPorVencer": [
    {
      "choferNombre": "Juan García",
      "documentoTipo": "Licencia",
      "diasRestantes": 15
    }
  ]
}
```

### Desempeño de Camiones
```http
GET /dashboard/desempeño-camiones
Authorization: Bearer <token>

Response (200):
[
  {
    "id": 1,
    "placa": "TM123AA",
    "ingresos": 8000000,
    "gastos": 2500000,
    "eficiencia": 87.5,
    "kmRecorridos": 2500,
    "viajesCompletos": 8
  }
]
```

### Desempeño de Choferes
```http
GET /dashboard/desempeño-choferes
Authorization: Bearer <token>

Response (200):
[
  {
    "id": 1,
    "nombre": "Juan García",
    "viajesCompletos": 12,
    "ingresos": 4200000,
    "comisiones": 420000,
    "puntualidad": 95
  }
]
```

---

## 📈 Reportes (`/reportes`)

### Rentabilidad
```http
GET /reportes/rentabilidad?granularidad=mensual&desde=2026-01-01&hasta=2026-03-31&camionIds=1,2
Authorization: Bearer <token>

Response (200):
{
  "filtrosAplicados": {
    "granularidad": "mensual",
    "camionIds": [1, 2],
    "desde": "2026-01-01",
    "hasta": "2026-03-31"
  },
  "resumen": {
    "totalIngresos": 50000000,
    "totalGastos": 15000000,
    "totalGananciaNeta": 35000000
  },
  "series": [
    {
      "periodo": "2026-01",
      "etiqueta": "Enero",
      "ingresos": 16000000,
      "gastos": 4800000,
      "gananciaNeta": 11200000,
      "kmRecorridos": 8500,
      "detalleGastos": {
        "operativosViaje": 2000000,
        "comisionChofer": 1500000,
        "sueldoChofer": 800000,
        "mantenimiento": 500000
      }
    }
  ]
}
```

### Rentabilidad Comparativa
```http
GET /reportes/rentabilidad-comparativa?compararPor=camion&desde=2026-01-01&hasta=2026-03-31
Authorization: Bearer <token>

Response (200):
{
  "filtrosAplicados": {
    "compararPor": "camion",
    "desde": "2026-01-01",
    "hasta": "2026-03-31"
  },
  "comparativas": [
    {
      "id": 1,
      "label": "TM123AA (Volvo)",
      "ingresos": 12000000,
      "gastos": 3800000,
      "gananciaNeta": 8200000
    },
    {
      "id": 2,
      "label": "TM456BB (Scania)",
      "ingresos": 14500000,
      "gastos": 4200000,
      "gananciaNeta": 10300000
    }
  ]
}
```

### Desempeño de Choferes
```http
GET /reportes/desempeño-choferes?desde=2026-01-01&hasta=2026-03-31
Authorization: Bearer <token>

Response (200):
{
  "filtrosAplicados": {
    "desde": "2026-01-01",
    "hasta": "2026-03-31"
  },
  "desempenio": [
    {
      "id": 1,
      "nombre": "Juan García",
      "viajesCompletos": 12,
      "ingresos": 4200000,
      "comisiones": 252000,
      "comisionPromedio": 21000
    }
  ]
}
```

### Gastos de Mantenimiento
```http
GET /reportes/gastos-mantenimiento?desde=2026-01-01&hasta=2026-03-31&camionIds=1
Authorization: Bearer <token>

Response (200):
{
  "filtrosAplicados": {
    "desde": "2026-01-01",
    "hasta": "2026-03-31",
    "camionIds": [1]
  },
  "resumenTotal": 2500000,
  "gastos": [
    {
      "camionId": 1,
      "patente": "TM123AA",
      "registros": [
        {
          "tipo": "Cambio de aceite",
          "fecha": "2026-02-15",
          "costo": 500000,
          "taller": "Taller XYZ"
        }
      ]
    }
  ]
}
```

---

## 🔧 Mantenimiento (`/mantenimiento`)

### Listar Registros de Mantenimiento
```http
GET /mantenimiento/:camionId/registros
Authorization: Bearer <token>

Response (200):
[
  {
    "id": 1,
    "camionId": 1,
    "tipoId": 1,
    "fechaPrograma": "2026-03-15",
    "fechaRealizacion": "2026-03-14",
    "kmActual": 155000,
    "costoReal": 500000,
    "taller": "Taller ABC",
    "observaciones": "Cambio de aceite realizado",
    "estado": "realizado"
  }
]
```

### Crear Registro de Mantenimiento
```http
POST /mantenimiento/:camionId/registros
Authorization: Bearer <token>
Content-Type: application/json

{
  "tipoId": 1,
  "fechaPrograma": "2026-03-20",
  "kmActual": 155500,
  "costoReal": 800000,
  "taller": "Taller Especializado",
  "observaciones": "Mantenimiento preventivo"
}

Response (201):
{ ... registro creado ... }
```

### Tipos de Mantenimiento
```http
GET /mantenimiento/tipos
Authorization: Bearer <token>

Response (200):
[
  {
    "id": 1,
    "nombre": "Cambio de aceite",
    "intervaloRecomendadoKm": 10000,
    "intervaloRecomendadoDias": 180
  },
  {
    "id": 2,
    "nombre": "Revisión de frenos",
    "intervaloRecomendadoKm": 20000,
    "intervaloRecomendadoDias": 360
  }
]
```

---

## ⚙️ Servicios de Mantenimiento (`/camiones/:id/servicios`)

### Listar Servicios
```http
GET /camiones/:id/servicios
Authorization: Bearer <token>

Response (200):
[
  {
    "id": 1,
    "camionId": 1,
    "tipo": "revision",
    "descripcion": "Revisión completa del motor",
    "fechaServicio": "2026-03-01",
    "costo": 1500000,
    "proveedor": "Taller XYZ"
  }
]
```

### Crear Servicio
```http
POST /camiones/:id/servicios
Authorization: Bearer <token>
Content-Type: application/json

{
  "tipo": "reparacion",
  "descripcion": "Reparación de suspensión",
  "fechaServicio": "2026-03-05",
  "costo": 3000000,
  "proveedor": "Taller Especializado"
}

Response (201):
{ ... servicio creado ... }
```

---

## ⛽ Repostadas (`/camiones/:id/repostadas`)

### Listar Repostadas
```http
GET /camiones/:id/repostadas
Authorization: Bearer <token>

Response (200):
[
  {
    "id": 1,
    "camionId": 1,
    "tipoCombustible": "diesel",
    "fechaRepostada": "2026-03-07",
    "kmRecorridos": 2500,
    "litros": 250,
    "consumoPromedio": 10.2
  }
]
```

### Registrar Repostada
```http
POST /camiones/:id/repostadas
Authorization: Bearer <token>
Content-Type: application/json

{
  "tipoCombustible": "diesel",
  "fechaRepostada": "2026-03-08",
  "kmRecorridos": 2600,
  "litros": 260
}

Response (201):
{ ... repostada registrada ... }
```

### Estadísticas de Repostadas
```http
GET /camiones/:id/repostadas/estadisticas
Authorization: Bearer <token>

Response (200):
{
  "consumoPromedio": 10.15,
  "ultimaRepostada": "2026-03-08T14:30:00Z",
  "kmTotalRecorridos": 125000,
  "litrosTotalesConsumidos": 12500
}
```

---

## 📌 Códigos de Estado HTTP

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| 200 | OK - Solicitud exitosa | GET exitoso |
| 201 | Created - Recurso creado | POST exitoso |
| 204 | No Content - Sin contenido | DELETE exitoso |
| 400 | Bad Request - Solicitud inválida | Datos faltantes |
| 401 | Unauthorized - No autenticado | Token expirado |
| 403 | Forbidden - No autorizado | Permisos insuficientes |
| 404 | Not Found - Recurso no existe | ID no encontrado |
| 409 | Conflict - Recurso duplicado | Patente duplicada |
| 500 | Server Error - Error del servidor | Fallo interno |

---

## 🔍 Filtros y Paginación

### Parámetros Comunes

```http
GET /camiones?page=1&limit=20&sort=patente&order=asc
Authorization: Bearer <token>
```

- `page`: Número de página (default: 1)
- `limit`: Registros por página (default: 20)
- `sort`: Campo para ordenar
- `order`: Dirección (asc/desc)
- `search`: Búsqueda general

### Filtros por Recurso

**Camiones**:
- `estado`: activo, mantenimiento, inactivo
- `tipoVehiculo`: Camión, Gandola, etc.

**Choferes**:
- `estado`: activo, licencia, inactivo
- `ciudad`: filtrar por ciudad

**Viajes**:
- `estado`: en_progreso, completado, cancelado
- `camionId`: ID del camión
- `choferId`: ID del chofer

**Reportes**:
- `granularidad`: diaria, semanal, mensual
- `desde`: Fecha inicio (YYYY-MM-DD)
- `hasta`: Fecha fin (YYYY-MM-DD)
- `camionIds`: Array de IDs de camiones
- `choferIds`: Array de IDs de choferes

---

## 💡 Ejemplos de Uso

### Obtener token y hacer request autenticado
```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@truckmanager.local",
    "password": "admin123"
  }'

# 2. Usar el token en un request
curl -X GET http://localhost:3000/api/camiones \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## 📚 Documentación Adicional

Para más información sobre las entidades, ver:
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Estructura de la base de datos
- [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md) - Plan de desarrollo

