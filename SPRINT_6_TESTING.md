# 🗺️ Sprint 6: Pruebas de Endpoints de Rutas

## Endpoints Creados

### 1. Obtener Rutas de un Viaje
**GET** `/api/viajes/:id/rutas`

```bash
curl -X GET http://localhost:3000/viajes/1/rutas \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "viajeId": 1,
    "orden": 1,
    "latitud": -25.2637,
    "longitud": -57.5759,
    "direccion": "Asunción, Paraguay",
    "odometroKm": null,
    "notas": "Punto de salida",
    "createdAt": "2026-03-04T10:30:00Z"
  },
  {
    "id": 2,
    "viajeId": 1,
    "orden": 2,
    "latitud": -25.4095,
    "longitud": -57.4438,
    "direccion": "Villarrica, Paraguay",
    "odometroKm": null,
    "notas": "Punto intermedio",
    "createdAt": "2026-03-04T10:31:00Z"
  }
]
```

---

### 2. Guardar/Actualizar Rutas de un Viaje
**POST** `/api/viajes/:id/rutas`

**Request Body:**
```json
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
      "odometroKm": 150.5,
      "notas": "Punto intermedio"
    },
    {
      "orden": 3,
      "latitud": -26.0047,
      "longitud": -56.4968,
      "direccion": "Coronel Oviedo, Paraguay",
      "odometroKm": 300.25,
      "notas": "Punto de destino"
    }
  ]
}
```

**Prueba en curl:**
```bash
curl -X POST http://localhost:3000/viajes/1/rutas \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rutas": [
      {"orden": 1, "latitud": -25.2637, "longitud": -57.5759, "direccion": "Asunción"},
      {"orden": 2, "latitud": -25.4095, "longitud": -57.4438, "direccion": "Villarrica"}
    ]
  }'
```

**Respuesta:**
- Las rutas se guardan
- El campo `kmRecorridos` del viaje se actualiza automáticamente con la distancia total
- Retorna arrays de ViajRuta creadas

---

## Características Implementadas

### Backend (Sprint 6)
✅ **Métodos en ViajsService:**
- `getRoutes(viajeId)` - Obtener rutas
- `saveRoutes(viajeId, rutas)` - Guardar/actualizar rutas
- `calculateTotalDistance(rutas)` - Calcula distancia total
- `haversineDistance(lat1, lon1, lat2, lon2)` - Haversine formula

✅ **Endpoints en ViajsController:**
- `GET /viajes/:id/rutas`
- `POST /viajes/:id/rutas`

✅ **DTOs:**
- `CreateViajRutaDTO` - DTO para crear ruta
- `SaveViajRutasDTO` - DTO con array de rutas

### Frontend (Sprint 6)
✅ **Métodos en viajsService:**
- `getRoutes(viajeId)` - Llamar API para obtener rutas
- `saveRoutes(viajeId, rutas)` - Llamar API para guardar rutas

✅ **Mejora en ViajeForm:**
- Al crear/editar viaje, guarda rutas automáticamente
- Calcula distancia total desde las rutas
- Actualiza `kmRecorridos` del viaje

✅ **Componente MapEditor:**
- Ya estaba implementado
- Captura clics en mapa para agregar puntos
- Muestra línea entre puntos
- Calcula distancia total con Haversine
- Permite editar/eliminar puntos

---

## Prueba Paso a Paso

### 1. Crear un Viaje
```bash
curl -X POST http://localhost:3000/viajes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "numeroViaje": "VIAJE-20260304-0001",
    "camionId": 1,
    "choferId": 1,
    "fechaInicio": "2026-03-04",
    "origen": "Asunción",
    "destino": "Coronel Oviedo",
    "valorViaje": 500
  }'
```

Nota el ID retornado (ej: 1)

### 2. Guardar Rutas del Viaje
```bash
curl -X POST http://localhost:3000/viajes/1/rutas \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rutas": [
      {"orden": 1, "latitud": -25.2637, "longitud": -57.5759, "direccion": "Asunción"},
      {"orden": 2, "latitud": -25.4095, "longitud": -57.4438, "direccion": "Villarrica"},
      {"orden": 3, "latitud": -26.0047, "longitud": -56.4968, "direccion": "Coronel Oviedo"}
    ]
  }'
```

### 3. Obtener Rutas del Viaje
```bash
curl -X GET http://localhost:3000/viajes/1/rutas \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Obtener Viaje Completo (incluyendo rutas)
```bash
curl -X GET http://localhost:3000/viajes/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Verifica que `kmRecorridos` se actualizó automáticamente

---

## Frontend: Flujo en ViajeForm

Cuando el usuario:
1. **Hace clic en el mapa** → MapEditor captura coordenadas
2. **Agrega múltiples puntos** → Se muestra línea conectando puntos
3. **Ver distancia** → Se calcula en tiempo real con Haversine
4. **Click "Guardar"** → Se crea el viaje + se guardan las rutas en segundo endpoint
5. **Éxito** → Muestra "Viaje creado y 3 punto(s) de ruta guardado(s)"

---

## Próximas Mejoras (Futuro)

- Editar puntos de ruta existentes (drag & drop)
- Calcular tiempo estimado entre puntos
- Integración con servicio de rutas reales (Google Maps, Mapbox)
- Guardar historial de rutas completadas
