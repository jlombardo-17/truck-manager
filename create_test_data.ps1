$token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImVtYWlsIjoiYWRtaW5AdHJ1Y2ttYW5hZ2VyLmxvY2FsIiwiaWF0IjoxNzcyNDk5MjgwLCJleHAiOjE3NzI1ODU2ODB9.qDrzRaDiEjpEJHFphzjYbGtpgEZJw2Ka3yA7nxhZyUA'
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

Write-Host "Creando servicios de prueba para el camión 3..."

# Servicio 1: Cambio de aceite y filtro
$body1 = @{
    fechaServicio = '2024-02-15'
    tipos = @('cambio_aceite', 'filtro_aceite')
    descripcion = 'Cambio de aceite y filtro regular'
    kilometraje = 45000
    costo = 2500
} | ConvertTo-Json

$result1 = (Invoke-WebRequest -Uri 'http://localhost:3000/camiones/3/servicios' -Method Post -Headers $headers -Body $body1 -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "✓ Servicio 1 creado: $($result1.id)"

# Servicio 2: Revisión general
$body2 = @{
    fechaServicio = '2024-01-20'
    tipos = @('revision_general')
    descripcion = 'Revisión general de mantenimiento'
    kilometraje = 42000
    costo = 5000
} | ConvertTo-Json

$result2 = (Invoke-WebRequest -Uri 'http://localhost:3000/camiones/3/servicios' -Method Post -Headers $headers -Body $body2 -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "✓ Servicio 2 creado: $($result2.id)"

# Servicio 3: Alineación y rotación de cubiertas
$body3 = @{
    fechaServicio = '2024-01-05'
    tipos = @('alineacion', 'rotacion_cubiertas')
    descripcion = 'Alineación y rotación de cubiertas'
    kilometraje = 40000
    costo = 3500
} | ConvertTo-Json

$result3 = (Invoke-WebRequest -Uri 'http://localhost:3000/camiones/3/servicios' -Method Post -Headers $headers -Body $body3 -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "✓ Servicio 3 creado: $($result3.id)"

Write-Host "`nCreando documentos de prueba para el camión 3..."

# Documento 1: Seguro (usando imagen placeholder en base64)
$placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRvY3VtZW50bzwvdGV4dD48L3N2Zz4="

$body4 = @{
    tipo = 'seguro'
    nombre = 'Póliza Seguro Camión 2024'
    rutaArchivo = $placeholderImage
    descripcion = 'Póliza de seguro integral para el camión'
    fechaVencimiento = '2025-02-28'
} | ConvertTo-Json -Depth 5

$result4 = (Invoke-WebRequest -Uri 'http://localhost:3000/camiones/3/documentos' -Method Post -Headers $headers -Body $body4 -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "✓ Documento 1 (Seguro) creado: $($result4.id)"

# Documento 2: Libreta de propiedad
$body5 = @{
    tipo = 'libreta_propiedad'
    nombre = 'Libreta de Propiedad Original'
    rutaArchivo = $placeholderImage
    descripcion = 'Documento de propiedad del vehículo'
} | ConvertTo-Json -Depth 5

$result5 = (Invoke-WebRequest -Uri 'http://localhost:3000/camiones/3/documentos' -Method Post -Headers $headers -Body $body5 -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "✓ Documento 2 (Libreta Propiedad) creado: $($result5.id)"

# Documento 3: Revisión técnica
$body6 = @{
    tipo = 'revision_tecnica'
    nombre = 'Revisión Técnica Anual 2024'
    rutaArchivo = $placeholderImage
    descripcion = 'Certificado de revisión técnica'
    fechaVencimiento = '2025-01-15'
} | ConvertTo-Json -Depth 5

$result6 = (Invoke-WebRequest -Uri 'http://localhost:3000/camiones/3/documentos' -Method Post -Headers $headers -Body $body6 -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "✓ Documento 3 (Revisión Técnica) creado: $($result6.id)"

Write-Host "`n✅ Todos los datos de prueba fueron creados exitosamente"
