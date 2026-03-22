# Scripts de datos de prueba

Estos scripts PowerShell sirven para poblar la API local con datos de prueba manuales.

## Ubicación

Todos los scripts de esta carpeta asumen que el backend está corriendo en `http://localhost:3000`.

## Scripts disponibles

- `create_choferes_test_data.ps1`: crea choferes de ejemplo con distintos estados.
- `create_mantenimiento_test.ps1`: crea registros de mantenimiento para pruebas de reportes y dashboard.
- `create_repostadas_test_data.ps1`: crea repostadas de prueba para un camión específico.
- `create_repostadas_test2.ps1`: variante más completa de repostadas, con login dinámico y fechas relativas.
- `create_test_data.ps1`: crea servicios y documentos de prueba para un camión específico.
- `create_viajes_reportes_test.ps1`: crea viajes distribuidos en el tiempo para validar reportes.

## Nota

Algunos scripts son más robustos que otros.

- Los que hacen login dinámico son más reutilizables.
- Los que usan token hardcodeado o IDs fijos deben considerarse scripts legacy de soporte manual.

Si en el futuro se estandariza la carga de datos de prueba, conviene reemplazarlos por un seed reproducible desde backend o por scripts npm documentados.
