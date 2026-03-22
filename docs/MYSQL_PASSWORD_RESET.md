# 🔐 Resetear Contraseña MySQL Root

## Método 1: Usando mysqladmin (Si recuerdas parte de la password)

Si crees recordar la contraseña, intenta estas comunes:
- (vacío)
- root
- admin
- password
- 123456

Prueba:
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot
```

## Método 2: Reset Completo (RECOMENDADO)

### Paso 1: Detener servicio MySQL
```powershell
Stop-Service MySQL80
```

### Paso 2: Crear archivo de reset temporal
Ejecuta esto en PowerShell:
```powershell
$resetFile = "C:\mysql-init.txt"
@"
ALTER USER 'root'@'localhost' IDENTIFIED BY 'TruckManager2024!';
FLUSH PRIVILEGES;
"@ | Out-File -FilePath $resetFile -Encoding ASCII
```

### Paso 3: Iniciar MySQL con archivo de reset
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --init-file="C:\mysql-init.txt" --console
```

⚠️ **IMPORTANTE**: Deja esa ventana abierta y abre OTRA terminal PowerShell para continuar.

### Paso 4: En la segunda terminal, verifica conexión
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p"TruckManager2024!"
```

Si funciona, verás `mysql>`. Escribe `EXIT;` para salir.

### Paso 5: Detén el mysqld en la primera terminal
Presiona `Ctrl+C` en la ventana donde corriste mysqld.

### Paso 6: Reinicia el servicio MySQL normal
```powershell
Start-Service MySQL80
Remove-Item "C:\mysql-init.txt"
```

### Paso 7: Verifica que funciona
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p"TruckManager2024!" -e "SELECT 'Funciona!' AS status;"
```

---

## Método 3: Crear Usuario Nuevo (Alternativa)

Si logras entrar con alguna password, crea un usuario nuevo:

```sql
CREATE USER 'truckadmin'@'localhost' IDENTIFIED BY 'TruckManager2024!';
GRANT ALL PRIVILEGES ON *.* TO 'truckadmin'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

Luego actualiza `backend/.env`:
```env
DB_USERNAME=truckadmin
DB_PASSWORD=TruckManager2024!
```

---

## 🚀 Método RÁPIDO con Scripts PowerShell

**Opción A - Reset Automático:**

Ejecuta estos comandos UNO POR UNO:

```powershell
# 1. Detener MySQL
Stop-Service MySQL80 -Force

# 2. Crear archivo de reset
@"
ALTER USER 'root'@'localhost' IDENTIFIED BY 'TruckManager2024!';
FLUSH PRIVILEGES;
"@ | Out-File -FilePath "C:\mysql-init.txt" -Encoding ASCII

# 3. Iniciar en modo reset (ABRE NUEVA TERMINAL después de este comando)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe' --init-file='C:\mysql-init.txt' --console"

# 4. Espera 10 segundos y luego prueba (EN LA TERMINAL ORIGINAL):
Start-Sleep -Seconds 10
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p"TruckManager2024!" -e "SELECT 'Password cambiada!' AS resultado;"
```

Si funciona, detén el proceso mysqld (Ctrl+C en la ventana que abrió) y reinicia:
```powershell
Start-Service MySQL80
Remove-Item "C:\mysql-init.txt" -Force
```

---

## Nueva Contraseña Sugerida
```
TruckManager2024!
```

Actualizarla en `backend/.env`:
```env
DB_PASSWORD=TruckManager2024!
```
