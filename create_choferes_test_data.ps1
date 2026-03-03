# Script para crear choferes de prueba
$baseUrl = "http://localhost:3000"

# Obtener token
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

# Chofer 1 - Carlos Rodríguez (Activo)
$chofer1 = @{
    numeroDocumento = "12345678"
    nombre = "Carlos"
    apellido = "Rodríguez"
    telefono = "+598 99 123 456"
    direccion = "Av. Italia 2525, Montevideo"
    fechaIngreso = "2020-01-15"
    fechaNacimiento = "1985-05-20"
    estado = "activo"
    sueldoBase = 35000.00
    porcentajeComision = 15.00
} | ConvertTo-Json

Write-Host "Creando chofer: Carlos Rodríguez..."
try {
    $response1 = Invoke-RestMethod -Uri "$baseUrl/choferes" -Method Post -Headers $headers -Body $chofer1
    Write-Host "✓ Chofer 1 creado - ID: $($response1.id)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error al crear chofer 1: $($_.Exception.Message)" -ForegroundColor Red
}

# Chofer 2 - María González (Activa)
$chofer2 = @{
    numeroDocumento = "23456789"
    nombre = "María"
    apellido = "González"
    telefono = "+598 98 234 567"
    direccion = "Bulevar Artigas 1234, Montevideo"
    fechaIngreso = "2019-06-10"
    fechaNacimiento = "1990-08-15"
    estado = "activo"
    sueldoBase = 38000.00
    porcentajeComision = 18.00
} | ConvertTo-Json

Write-Host "Creando chofer: María González..."
try {
    $response2 = Invoke-RestMethod -Uri "$baseUrl/choferes" -Method Post -Headers $headers -Body $chofer2
    Write-Host "✓ Chofer 2 creado - ID: $($response2.id)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error al crear chofer 2: $($_.Exception.Message)" -ForegroundColor Red
}

# Chofer 3 - Juan Pérez (Activo)
$chofer3 = @{
    numeroDocumento = "34567890"
    nombre = "Juan"
    apellido = "Pérez"
    telefono = "+598 97 345 678"
    direccion = "Colón 1555, Montevideo"
    fechaIngreso = "2021-03-20"
    fechaNacimiento = "1988-11-30"
    estado = "activo"
    sueldoBase = 32000.00
    porcentajeComision = 12.50
} | ConvertTo-Json

Write-Host "Creando chofer: Juan Pérez..."
try {
    $response3 = Invoke-RestMethod -Uri "$baseUrl/choferes" -Method Post -Headers $headers -Body $chofer3
    Write-Host "✓ Chofer 3 creado - ID: $($response3.id)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error al crear chofer 3: $($_.Exception.Message)" -ForegroundColor Red
}

# Chofer 4 - Ana Martínez (Inactiva - de vacaciones)
$chofer4 = @{
    numeroDocumento = "45678901"
    nombre = "Ana"
    apellido = "Martínez"
    telefono = "+598 96 456 789"
    direccion = "18 de Julio 1234, Montevideo"
    fechaIngreso = "2018-09-05"
    fechaNacimiento = "1987-03-25"
    estado = "inactivo"
    sueldoBase = 40000.00
    porcentajeComision = 20.00
} | ConvertTo-Json

Write-Host "Creando chofer: Ana Martínez..."
try {
    $response4 = Invoke-RestMethod -Uri "$baseUrl/choferes" -Method Post -Headers $headers -Body $chofer4
    Write-Host "✓ Chofer 4 creado - ID: $($response4.id)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error al crear chofer 4: $($_.Exception.Message)" -ForegroundColor Red
}

# Chofer 5 - Pedro Fernández (Suspendido)
$chofer5 = @{
    numeroDocumento = "56789012"
    nombre = "Pedro"
    apellido = "Fernández"
    telefono = "+598 95 567 890"
    direccion = "8 de Octubre 2345, Montevideo"
    fechaIngreso = "2022-01-10"
    fechaNacimiento = "1992-07-18"
    estado = "suspendido"
    sueldoBase = 28000.00
    porcentajeComision = 10.00
} | ConvertTo-Json

Write-Host "Creando chofer: Pedro Fernández..."
try {
    $response5 = Invoke-RestMethod -Uri "$baseUrl/choferes" -Method Post -Headers $headers -Body $chofer5
    Write-Host "✓ Chofer 5 creado - ID: $($response5.id)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error al crear chofer 5: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Resumen ===" -ForegroundColor Cyan
Write-Host "5 choferes creados con diferentes estados" -ForegroundColor Cyan
Write-Host "- 3 Activos (Carlos, María, Juan)" -ForegroundColor Green
Write-Host "- 1 Inactivo (Ana - vacaciones)" -ForegroundColor Yellow
Write-Host "- 1 Suspendido (Pedro)" -ForegroundColor Red
