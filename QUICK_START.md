# ⚡ Quick Start - Truck Manager

**Tu proyecto está listo. Inicia en 5 pasos:**

## 1️⃣ Abre Terminal y Ve a la Carpeta del Proyecto

```bash
cd C:\Users\Usuario\Proyectos\truck-manager
```

## 2️⃣ Inicializa Git localmente

```bash
git init
git config user.name "Tu Nombre Completo"
git config user.email "tu.email@gmail.com"
git add .
git commit -m "feat: Initial commit - Truck Manager project setup"
```

## 3️⃣ Crea el Repositorio en GitHub

- Abre: https://github.com/new
- **Owner**: jlombardo-17
- **Repo name**: truck-manager
- **Visibility**: Private o Public
- Haz click en "Create repository"

## 4️⃣ Conecta tu Repositorio Local

```bash
git remote add origin https://github.com/jlombardo-17/truck-manager.git
git branch -M main
git push -u origin main
```

## 5️⃣ Instala Dependencias

```bash
# Raíz del proyecto
npm install

# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

---

## 🔧 Configura el Entorno

### Backend (backend/.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=truck_manager
JWT_SECRET=TuClaveSecretaAquí123456789
JWT_EXPIRES_IN=24h
API_PORT=3000
NODE_ENV=development
```

### Frontend (frontend/.env)
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=Truck Manager
```

---

## 🗄️ Crea la Base de Datos

### Opción A: Desde PostgreSQL (psql)
```bash
psql -U postgres
CREATE DATABASE truck_manager;
\q
```

### Opción B: Desde pgAdmin (GUI)
1. Abre pgAdmin
2. Right-click "Databases" → "Create" → "Database"
3. Nombre: `truck_manager`

---

## 🚀 Inicia en Desarrollo

### Terminal 1: Backend
```bash
cd backend
npm run start:dev
```
Espera a ver: `✔ Listening on port 3000`

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```
Espera a ver: `✔ Local: http://localhost:5173/`

### Verifica que funcione:
- Backend: http://localhost:3000 → `"🚚 Welcome to Truck Manager API!"`
- Frontend: http://localhost:5173 → Página vacía con tema Material-UI

---

## 📚 Lee Esto Después

1. **[SETUP.md](SETUP.md)** - Setup completo y troubleshooting
2. **[DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md)** - Plan de 20 semanas
3. **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** - Esquema de BD
4. **[PLAN_EJECUTIVO.md](PLAN_EJECUTIVO.md)** - Resumen ejecutivo

---

## ✅ Checklist Rápido

- [ ] Proyecto clonado en `C:\Users\Usuario\Proyectos\truck-manager`
- [ ] Git inicializado (`git init`)
- [ ] Repositorio creado en GitHub
- [ ] Código pusheado a GitHub (`git push`)
- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos `truck_manager` creada
- [ ] `npm install` ejecutado en backend y frontend
- [ ] `.env` configurado en ambas carpetas
- [ ] Backend corriendo en puerto 3000
- [ ] Frontend corriendo en puerto 5173

---

## 🎓 Próximo Paso

Sigue el **[DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md)** para las tareas del Sprint 1-2 (Autenticación).

---

## 💡 Comandos Útiles

```bash
# Ver estado de Git
git status
git log --oneline -5

# Hacer commits
git add .
git commit -m "tu mensaje"
git push

# Ver ramas
git branch -a

# Ejecutar ambos (backend + frontend)
npm run dev

# Solo backend
npm run backend:dev

# Solo frontend
npm run frontend:dev

# Ver procesos en puertos
# Windows
netstat -ano | findstr :3000
lsof -i :3000

# Matar proceso en puerto
# Windows
taskkill /PID <PID> /F
# Linux/Mac
kill -9 $(lsof -t -i :3000)
```

---

**¡A programar!** 🚀🚚

Si algo no funciona, revisa [SETUP.md](SETUP.md) → Sección "Troubleshooting"
