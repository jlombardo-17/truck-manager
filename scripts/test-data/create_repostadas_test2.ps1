# Script para crear repostadas de prueba
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

Write-Host "Creando repostadas de prueba..." -ForegroundColor Cyan

# Repostada 1 - Camión 1, Hace 22 días
$fecha1 = (Get-Date).AddDays(-22).ToString("yyyy-MM-dd")
$repostada1 = @{
    tipoCombustible = "diesel"
    fechaRepostada = $fecha1
    litros = 120
    precioLitro = 135
    costo = 16200
    kmRecorridos = 45000
    consumoPromedio = 8.5
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/camiones/1/repostadas" -Method Post -Headers $headers -Body $repostada1 | Out-Null
    Write-Host "✓ Repostada 1 creada" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Repostada 2 - Camión 1, Hace 18 días
$fecha2 = (Get-Date).AddDays(-18).ToString("yyyy-MM-dd")
$repostada2 = @{
    tipoCombustible = "diesel"
    fechaRepostada = $fecha2
    litros = 105
    precioLitro = 138
    costo = 14490
    kmRecorridos = 52500
    consumoPromedio = 8.5
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/camiones/1/repostadas" -Method Post -Headers $headers -Body $repostada2 | Out-Null
    Write-Host "✓ Repostada 2 creada" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Repostada 3 - Camión 1, Hace 10 días
$fecha3 = (Get-Date).AddDays(-10).ToString("yyyy-MM-dd")
$repostada3 = @{
    tipoCombustible = "diesel"
    fechaRepostada = $fecha3
    litros = 110
    precioLitro = 136
    costo = 14960
    kmRecorridos = 59000
    consumoPromedio = 8.5
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/camiones/1/repostadas" -Method Post -Headers $headers -Body $repostada3 | Out-Null
    Write-Host "✓ Repostada 3 creada" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Repostada 4 - Camión 2, Hace 19 días
$fecha4 = (Get-Date).AddDays(-19).ToString("yyyy-MM-dd")
$repostada4 = @{
    tipoCombustible = "diesel"
    fechaRepostada = $fecha4
    litros = 130
    precioLitro = 135
    costo = 17550
    kmRecorridos = 38000
    consumoPromedio = 8.0
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/camiones/2/repostadas" -Method Post -Headers $headers -Body $repostada4 | Out-Null
    Write-Host "✓ Repostada 4 creada" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Repostada 5 - Camión 2, Hace 12 días
$fecha5 = (Get-Date).AddDays(-12).ToString("yyyy-MM-dd")
$repostada5 = @{
    tipoCombustible = "diesel"
    fechaRepostada = $fecha5
    litros = 125
    precioLitro = 138
    costo = 17250
    kmRecorridos = 46500
    consumoPromedio = 8.0
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/camiones/2/repostadas" -Method Post -Headers $headers -Body $repostada5 | Out-Null
    Write-Host "✓ Repostada 5 creada" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Repostada 6 - Camión 2, Hace 4 días
$fecha6 = (Get-Date).AddDays(-4).ToString("yyyy-MM-dd")
$repostada6 = @{
    tipoCombustible = "diesel"
    fechaRepostada = $fecha6
    litros = 115
    precioLitro = 137
    costo = 15755
    kmRecorridos = 52000
    consumoPromedio = 8.0
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/camiones/2/repostadas" -Method Post -Headers $headers -Body $repostada6 | Out-Null
    Write-Host "✓ Repostada 6 creada" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Repostadas creadas exitosamente ===" -ForegroundColor Green
Write-Host "Se crearon 6 repostadas con datos distribuidos"
