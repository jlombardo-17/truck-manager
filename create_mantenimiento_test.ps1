# Script para crear registros de mantenimiento de prueba
$baseUrl = "http://localhost:3000"

Write-Host "Obteniendo token de autenticación..." -ForegroundColor Cyan
$loginBody = @{
    email = "admin@truckmanager.local"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.accessToken
    Write-Host "✓ Token obtenido exitosamente" -ForegroundColor Green
} catch {
    Write-Host "✗ Error al obtener token: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

Write-Host "Creando registros de mantenimiento de prueba..." -ForegroundColor Cyan

# Mantenimiento 1 - Camión 1, Hace 20 días
$fecha1 = (Get-Date).AddDays(-20).ToString("yyyy-MM-dd")
$mantenimiento1 = @{
    camionId = 1
    fechaMantenimiento = $fecha1
    tipo = "cambio_aceite"
    descripcion = "Cambio de aceite y filtro"
    costo = 3500
    kmRecorridos = 50000
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/mantenimiento/registro" -Method Post -Headers $headers -Body $mantenimiento1 | Out-Null
    Write-Host "✓ Mantenimiento 1 creado (Cambio aceite Camión 1)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Mantenimiento 2 - Camión 1, Hace 8 días
$fecha2 = (Get-Date).AddDays(-8).ToString("yyyy-MM-dd")
$mantenimiento2 = @{
    camionId = 1
    fechaMantenimiento = $fecha2
    tipo = "revision_general"
    descripcion = "Revisión general de frenos y dirección"
    costo = 2800
    kmRecorridos = 57500
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/mantenimiento/registro" -Method Post -Headers $headers -Body $mantenimiento2 | Out-Null
    Write-Host "✓ Mantenimiento 2 creado (Revisión Camión 1)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Mantenimiento 3 - Camión 2, Hace 25 días
$fecha3 = (Get-Date).AddDays(-25).ToString("yyyy-MM-dd")
$mantenimiento3 = @{
    camionId = 2
    fechaMantenimiento = $fecha3
    tipo = "cambio_aceite"
    descripcion = "Cambio de aceite, filtro y bujías"
    costo = 4200
    kmRecorridos = 32000
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/mantenimiento/registro" -Method Post -Headers $headers -Body $mantenimiento3 | Out-Null
    Write-Host "✓ Mantenimiento 3 creado (Cambio aceite Camión 2)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Mantenimiento 4 - Camión 2, Hace 14 días
$fecha4 = (Get-Date).AddDays(-14).ToString("yyyy-MM-dd")
$mantenimiento4 = @{
    camionId = 2
    fechaMantenimiento = $fecha4
    tipo = "reparacion_frenos"
    descripcion = "Reparación de pastillas de freno"
    costo = 5600
    kmRecorridos = 44000
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/mantenimiento/registro" -Method Post -Headers $headers -Body $mantenimiento4 | Out-Null
    Write-Host "✓ Mantenimiento 4 creado (Reparación frenos Camión 2)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Mantenimiento 5 - Camión 1, Hace 3 días  
$fecha5 = (Get-Date).AddDays(-3).ToString("yyyy-MM-dd")
$mantenimiento5 = @{
    camionId = 1
    fechaMantenimiento = $fecha5
    tipo = "alineacion"
    descripcion = "Alineación y balanceo de llantas"
    costo = 2200
    kmRecorridos = 60000
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/mantenimiento/registro" -Method Post -Headers $headers -Body $mantenimiento5 | Out-Null
    Write-Host "✓ Mantenimiento 5 creado (Alineación Camión 1)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Mantenimientos creados exitosamente ===" -ForegroundColor Green
Write-Host "Se crearon 5 registros de mantenimiento"
Write-Host "`n📊 Datos de prueba completos. Ahora puedes:" -ForegroundColor Cyan
Write-Host "  1. Acceder a http://localhost:5173" -ForegroundColor Cyan
Write-Host "  2. Ir a Reportes" -ForegroundColor Cyan
Write-Host "  3. Hacer clic en 'Últimos 30 días'" -ForegroundColor Cyan
Write-Host "  4. ¡Ver las gráficas con los datos de prueba!" -ForegroundColor Cyan
