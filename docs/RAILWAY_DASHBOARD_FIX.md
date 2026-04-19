# Pasos para Arreglar Dashboard en Railway

## Problema
Después de cambios de moneda, el dashboard en Railway muestra ceros en ingresos/gastos.

## Causa Probable
Las columnas `valor_viaje_uyu`, `moneda`, `cotizacion_usd_uyu` no existen en la BD de Railway, o existen pero están vacías.

## Solución - Hacer en este orden:

### 1. Ejecutar Script SQL en Railway (PRIMERO)
```
- Ve a tu proyecto en railway.app
- Haz clic en "MySQL" (la BD)
- Abre la consola SQL (o usa el query editor)
- Copia TODO el contenido de: /backend/scripts/fix-viajes-moneda.sql
- Pégalo y ejecuta
- Verifica que las columnas existan y tengan datos
```

### 2. Redeploy del Backend
```
- Ve a tu proyecto en railway.app
- Haz clic en el servicio "backend"
- Busca el último deploy
- Haz clic en "Redeploy"
- Espera a que termine
```

### 3. Limpiar Cache/Refrescar
```
- En tu navegador, limpia el cache (Ctrl+Shift+Del)
- Recarga dashboard (F5)
```

### 4. Ver Logs para Diagnóstico
Si aún no funciona:
```
- En railway.app, abre el backend service
- Ve a "Logs" (arriba)
- Busca líneas que digan "[Dashboard]"
- Te dirán exactamente qué está pasando
```

## Cosas que Verificar en Railway

1. **¿Existen las columnas?**
   ```sql
   DESCRIBE viajes;
   ```
   Deberías ver: `valor_viaje_uyu`, `moneda`, `cotizacion_usd_uyu`

2. **¿Hay viajes completados?**
   ```sql
   SELECT COUNT(*) FROM viajes WHERE estado = 'completado';
   ```
   Deberías ver > 0

3. **¿Tienen valores los viajes?**
   ```sql
   SELECT id, numero_viaje, valor_viaje, valor_viaje_uyu, estado 
   FROM viajes 
   LIMIT 5;
   ```
   Deberías ver valores en ambas columnas

## Si Aún No Funciona
- Los logs con [Dashboard] te mostrarán exactamente dónde falla
- Comparte esos logs para diagnosticar
