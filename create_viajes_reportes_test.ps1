# Script para crear viajes de prueba para verificar reportes
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

Write-Host "Creando viajes de prueba para reportes..." -ForegroundColor Cyan

# Viaje 1 - Hace 25 días (para estar dentro de los últimos 30)
$fecha1 = (Get-Date).AddDays(-25).ToString("yyyy-MM-dd")
$fecha1End = (Get-Date).AddDays(-25).AddHours(4).ToString("yyyy-MM-dd")
$viaje1 = @{
    numeroViaje = "V001"
    origen = "Montevideo"
    destino = "Paysandú"
    latitudOrigen = -34.9011
    longitudOrigen = -56.1645
    latitudDestino = -32.3181
    longitudDestino = -56.5088
    fechaInicio = $fecha1
    fechaFin = $fecha1End
    valorViaje = 5000
    kmRecorridos = 180
    pesoCargaKg = 8000
    descripcionCarga = "Productos alimenticios"
    choferId = 1
    camionId = 1
} | ConvertTo-Json

try {
    $result1 = Invoke-RestMethod -Uri "$baseUrl/viajes" -Method Post -Headers $headers -Body $viaje1
    Write-Host "✓ Viaje 1 creado: V001" -ForegroundColor Green
} catch {
    Write-Host "✗ Error creando viaje 1: $($_.Exception.Message)" -ForegroundColor Red
}

# Viaje 2 - Hace 23 días
$fecha2 = (Get-Date).AddDays(-23).ToString("yyyy-MM-dd")
$fecha2End = (Get-Date).AddDays(-23).AddHours(5).ToString("yyyy-MM-dd")
$viaje2 = @{
    numeroViaje = "V002"
    origen = "Montevideo"
    destino = "Salto"
    latitudOrigen = -34.9011
    longitudOrigen = -56.1645
    latitudDestino = -31.3921
    longitudDestino = -57.9533
    fechaInicio = $fecha2
    fechaFin = $fecha2End
    valorViaje = 6000
    kmRecorridos = 250
    pesoCargaKg = 10000
    descripcionCarga = "Bebidas"
    choferId = 2
    camionId = 1
} | ConvertTo-Json

try {
    $result2 = Invoke-RestMethod -Uri "$baseUrl/viajes" -Method Post -Headers $headers -Body $viaje2
    Write-Host "✓ Viaje 2 creado: V002" -ForegroundColor Green
} catch {
    Write-Host "✗ Error creando viaje 2: $($_.Exception.Message)" -ForegroundColor Red
}

# Viaje 3 - Hace 20 días
$fecha3 = (Get-Date).AddDays(-20).ToString("yyyy-MM-dd")
$fecha3End = (Get-Date).AddDays(-20).AddHours(6).ToString("yyyy-MM-dd")
$viaje3 = @{
    numeroViaje = "V003"
    origen = "Montevideo"
    destino = "Rivera"
    latitudOrigen = -34.9011
    longitudOrigen = -56.1645
    latitudDestino = -30.8887
    longitudDestino = -55.5045
    fechaInicio = $fecha3
    fechaFin = $fecha3End
    valorViaje = 7500
    kmRecorridos = 320
    pesoCargaKg = 12000
    descripcionCarga = "Autopartes"
    choferId = 3
    camionId = 2
} | ConvertTo-Json

try {
    $result3 = Invoke-RestMethod -Uri "$baseUrl/viajes" -Method Post -Headers $headers -Body $viaje3
    Write-Host "✓ Viaje 3 creado: V003" -ForegroundColor Green
} catch {
    Write-Host "✗ Error creando viaje 3: $($_.Exception.Message)" -ForegroundColor Red
}

# Viaje 4 - Hace 15 días
$fecha4 = (Get-Date).AddDays(-15).ToString("yyyy-MM-dd")
$fecha4End = (Get-Date).AddDays(-15).AddHours(7).ToString("yyyy-MM-dd")
$viaje4 = @{
    numeroViaje = "V004"
    origen = "Montevideo"
    destino = "Tacuarembó"
    latitudOrigen = -34.9011
    longitudOrigen = -56.1645
    latitudDestino = -32.2779
    longitudDestino = -55.9844
    fechaInicio = $fecha4
    fechaFin = $fecha4End
    valorViaje = 8000
    kmRecorridos = 380
    pesoCargaKg = 15000
    descripcionCarga = "Maquinaria"
    choferId = 1
    camionId = 2
} | ConvertTo-Json

try {
    $result4 = Invoke-RestMethod -Uri "$baseUrl/viajes" -Method Post -Headers $headers -Body $viaje4
    Write-Host "✓ Viaje 4 creado: V004" -ForegroundColor Green
} catch {
    Write-Host "✗ Error creando viaje 4: $($_.Exception.Message)" -ForegroundColor Red
}

# Viaje 5 - Hace 10 días
$fecha5 = (Get-Date).AddDays(-10).ToString("yyyy-MM-dd")
$fecha5End = (Get-Date).AddDays(-10).AddHours(2.5).ToString("yyyy-MM-dd")
$viaje5 = @{
    numeroViaje = "V005"
    origen = "Paysandú"
    destino = "Salto"
    latitudOrigen = -32.3181
    longitudOrigen = -56.5088
    latitudDestino = -31.3921
    longitudDestino = -57.9533
    fechaInicio = $fecha5
    fechaFin = $fecha5End
    valorViaje = 4500
    kmRecorridos = 120
    pesoCargaKg = 7000
    descripcionCarga = "Productos lácteos"
    choferId = 2
    camionId = 1
} | ConvertTo-Json

try {
    $result5 = Invoke-RestMethod -Uri "$baseUrl/viajes" -Method Post -Headers $headers -Body $viaje5
    Write-Host "✓ Viaje 5 creado: V005" -ForegroundColor Green
} catch {
    Write-Host "✗ Error creando viaje 5: $($_.Exception.Message)" -ForegroundColor Red
}

# Viaje 6 - Hace 5 días
$fecha6 = (Get-Date).AddDays(-5).ToString("yyyy-MM-dd")
$fecha6End = (Get-Date).AddDays(-5).AddHours(2).ToString("yyyy-MM-dd")
$viaje6 = @{
    numeroViaje = "V006"
    origen = "Montevideo"
    destino = "Mercedes"
    latitudOrigen = -34.9011
    longitudOrigen = -56.1645
    latitudDestino = -33.5179
    longitudDestino = -56.8783
    fechaInicio = $fecha6
    fechaFin = $fecha6End
    valorViaje = 3500
    kmRecorridos = 90
    pesoCargaKg = 5000
    descripcionCarga = "Frutas"
    choferId = 3
    camionId = 1
} | ConvertTo-Json

try {
    $result6 = Invoke-RestMethod -Uri "$baseUrl/viajes" -Method Post -Headers $headers -Body $viaje6
    Write-Host "✓ Viaje 6 creado: V006" -ForegroundColor Green
} catch {
    Write-Host "✗ Error creando viaje 6: $($_.Exception.Message)" -ForegroundColor Red
}

# Viaje 7 - Hace 2 días
$fecha7 = (Get-Date).AddDays(-2).ToString("yyyy-MM-dd")
$fecha7End = (Get-Date).AddDays(-2).AddHours(2).ToString("yyyy-MM-dd")
$viaje7 = @{
    numeroViaje = "V007"
    origen = "Montevideo"
    destino = "Maldonado"
    latitudOrigen = -34.9011
    longitudOrigen = -56.1645
    latitudDestino = -34.4097
    longitudDestino = -54.9193
    fechaInicio = $fecha7
    fechaFin = $fecha7End
    valorViaje = 4000
    kmRecorridos = 110
    pesoCargaKg = 6000
    descripcionCarga = "Textiles"
    choferId = 1
    camionId = 2
} | ConvertTo-Json

try {
    $result7 = Invoke-RestMethod -Uri "$baseUrl/viajes" -Method Post -Headers $headers -Body $viaje7
    Write-Host "✓ Viaje 7 creado: V007" -ForegroundColor Green
} catch {
    Write-Host "✗ Error creando viaje 7: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Viajes creados exitosamente ===" -ForegroundColor Green
Write-Host "Se crearon 7 viajes con datos distribuidos en los últimos 30 días"
Write-Host "Para ver los reportes, ingresa a Reportes > Últimos 30 días"
