# 📚 Guía de Setup - Truck Manager

## 1️⃣ Requisitos Previos

Asegurate de tener instalado:
- **Node.js** (v18+) - [Descargar](https://nodejs.org)
- **Git** - [Descargar](https://git-scm.com)
- **PostgreSQL** (v14+) - [Descargar](https://www.postgresql.org/download)

Verifica las instalaciones:
```bash
node --version
git --version
psql --version
```

## 2️⃣ Configurar Repositorio Git Localmente

Abre una terminal en raíz del proyecto (`C:\Users\Usuario\Proyectos\truck-manager`) y ejecuta:

```bash
# Inicializar repositorio git
git init

# Configurar usuario (reemplaza con tus datos)
git config user.name "Tu Nombre"
git config user.email "tu.email@gmail.com"

# Crear rama principal
git branch -M main

# Agregar todos los archivos
git add .

# Crear commit inicial
git commit -m "feat: Initial project setup with NestJS backend and React frontend"
```

## 3️⃣ Crear Repositorio en GitHub

1. Ve a [GitHub](https://github.com/new)
2. Crea un nuevo repositorio con el nombre: `truck-manager`
   - **Owner**: jlombardo-17
   - **Repository name**: truck-manager
   - **Description**: Sistema de gestión y mantenimiento de flota de camiones
   - **Visibility**: Private (o Public según prefieras)
   - **NO** inicialices con README, .gitignore o licencia (ya los tenemos)
3. Haz clic en "Create repository"

## 4️⃣ Conectar Repositorio Local a GitHub

En la terminal, ejecuta (reemplaza `jlombardo-17` con tu usuario):

```bash
# Añadir el repositorio remoto
git remote add origin https://github.com/jlombardo-17/truck-manager.git

# Verificar la conexión
git remote -v

# Hacer push a GitHub
git branch -M main
git push -u origin main
```

**Si tienes autenticación de dos factores (2FA):**
1. Necesitarás un **Personal Access Token** en lugar de contraseña
2. Ve a GitHub → Settings → Developer settings → Personal access tokens
3. Crea un token con permisos `repo`
4. Usa el token como contraseña en el git push

## 5️⃣ Configurar Base de Datos

### Windows con PostgreSQL

1. Abre **pgAdmin** (incluido en PostgreSQL)
2. Crea una base de datos llamada `truck_manager`:
   ```sql
   CREATE DATABASE truck_manager;
   ```
3. Verifica las credenciales en `.env` del backend

### O usa línea de comandos:
```bash
psql -U postgres

# En el prompt psql:
CREATE DATABASE truck_manager;
\l  # Listar bases de datos para verificar
\q  # Salir
```

## 6️⃣ Instalar Dependencias

Desde la raíz del proyecto:

```bash
# Instalar dependencias del root
npm install

# Instalar dependencias del backend
cd backend
npm install
copy .env.example .env  # Crear archivo .env

# Instalar dependencias del frontend
cd ../frontend
npm install
copy .env.example .env  # Crear archivo .env

# Volver a raíz
cd ..
```

## 7️⃣ Configurar Variables de Entorno

### Backend - `backend/.env`
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=truck_manager
JWT_SECRET=tu_clave_secreta_super_larga_aqui_123456
JWT_EXPIRES_IN=24h
API_PORT=3000
NODE_ENV=development
```

### Frontend - `frontend/.env`
```
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=Truck Manager
```

## 8️⃣ Ejecutar en Desarrollo

**Opción A: Dos terminales separadas (Recomendado)**

Terminal 1 - Backend:
```bash
cd backend
npm run start:dev
# Verás: ✔ Listening on port 3000
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
# Verás: ✔ Local: http://localhost:5173/
```

**Opción B: Una sola terminal (Monorepo)**
```bash
npm run dev
# Ejecuta ambos automáticamente
```

## 9️⃣ Verificar que Todo Funciona

1. Backend: [http://localhost:3000](http://localhost:3000)
   - Debería mostrar: `"🚚 Welcome to Truck Manager API!"`

2. Frontend: [http://localhost:5173](http://localhost:5173)
   - Debería mostrar: `"Bienvenido a Truck Manager"`

## 🔟 Monitorear Cambios en GitHub

Para ver que tus cambios se sincronizaron correctamente:
```bash
git log --oneline -5  # Ver últimos 5 commits
git status            # Ver estado actual
```

## 📋 Próximos Pasos Después del Setup

1. Crear módulos base (Camiones, Choferes, Viajes)
2. Definir entidades de BD
3. Crear endpoints API
4. Crear componentes React
5. Integrar mapas para rutas

---

## ❓ Troubleshooting

### Error: "Cannot find module '@nestjs/common'"
```bash
cd backend && npm install
```

### Error: "Port 3000 already in use"
- Cambia el puerto en `backend/.env`: `API_PORT=3001`
- O mata el proceso: `lsof -ti :3000 | xargs kill -9` (Mac/Linux)

### Error al conectar a PostgreSQL
- Verifica que PostgreSQL esté corriendo
- Comprueba credenciales en `.env`
- Reinicia el servicio PostgreSQL

### Git push rechazado
- Verifica: `git remote -v`
- Si falta el remote: `git remote add origin https://github.com/jlombardo-17/truck-manager.git`

