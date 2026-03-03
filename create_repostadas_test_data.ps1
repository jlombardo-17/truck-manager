$token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImVtYWlsIjoiYWRtaW5AdHJ1Y2ttYW5hZ2VyLmxvY2FsIiwiaWF0IjoxNzcyNDk5MjgwLCJleHAiOjE3NzI1ODU2ODB9.qDrzRaDiEjpEJHFphzjYbGtpgEZJw2Ka3yA7nxhZyUA'
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

Write-Host "Creando repostadas de prueba para el camión 3..."

# Repostada 1: Diésel
$body1 = @{
    fechaRepostada = '2024-02-18'
    tipoCombustible = 'diesel'
    kmRecorridos = 650
    litros = 100
    consumoPromedio = 6.5
    precioLitro = 45.50
    costo = 4550
} | ConvertTo-Json

$result1 = (Invoke-WebRequest -Uri 'http://localhost:3000/camiones/3/repostadas' -Method Post -Headers $headers -Body $body1 -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "✓ Repostada 1 (Diésel) creada: $($result1.id)"

# Repostada 2: Diésel
$body2 = @{
    fechaRepostada = '2024-02-10'
    tipoCombustible = 'diesel'
    kmRecorridos = 600
    litros = 95
    consumoPromedio = 6.32
    precioLitro = 44.80
    costo = 4256
} | ConvertTo-Json

$result2 = (Invoke-WebRequest -Uri 'http://localhost:3000/camiones/3/repostadas' -Method Post -Headers $headers -Body $body2 -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "✓ Repostada 2 (Diésel) creada: $($result2.id)"

# Repostada 3: Diésel
$body3 = @{
    fechaRepostada = '2024-02-02'
    tipoCombustible = 'diesel'
    kmRecorridos = 680
    litros = 105
    consumoPromedio = 6.48
    precioLitro = 45.00
    costo = 4725
} | ConvertTo-Json

$result3 = (Invoke-WebRequest -Uri 'http://localhost:3000/camiones/3/repostadas' -Method Post -Headers $headers -Body $body3 -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "✓ Repostada 3 (Diésel) creada: $($result3.id)"

# Repostada 4: Diésel
$body4 = @{
    fechaRepostada = '2024-01-25'
    tipoCombustible = 'diesel'
    kmRecorridos = 620
    litros = 98
    consumoPromedio = 6.33
    precioLitro = 44.00
    costo = 4312
} | ConvertTo-Json

$result4 = (Invoke-WebRequest -Uri 'http://localhost:3000/camiones/3/repostadas' -Method Post -Headers $headers -Body $body4 -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "✓ Repostada 4 (Diésel) creada: $($result4.id)"

# Repostada 5: Diésel
$body5 = @{
    fechaRepostada = '2024-01-18'
    tipoCombustible = 'diesel'
    kmRecorridos = 675
    litros = 102
    consumoPromedio = 6.62
    precioLitro = 43.50
    costo = 4437
} | ConvertTo-Json

$result5 = (Invoke-WebRequest -Uri 'http://localhost:3000/camiones/3/repostadas' -Method Post -Headers $headers -Body $body5 -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "✓ Repostada 5 (Diésel) creada: $($result5.id)"

Write-Host "`n✅ Todas las repostadas de prueba fueron creadas exitosamente"
Write-Host "`nEstadísticas esperadas:"
Write-Host "- Total Repostadas: 5"
Write-Host "- Total KM: 3225 km"
Write-Host "- Total Litros: 500 L"
Write-Host "- Consumo Promedio: 6.47 km/L"
Write-Host "- Costo Total: $22,280"
Write-Host "- Costo Promedio: $4,456"
