---
description: Run ESLint and Prettier on backend and/or frontend, report errors and apply auto-fix
---

# Lint & Format

Runs ESLint + Prettier on the specified scope and applies auto-fixes.

## Usage

```
/lint-fix           # backend + frontend
/lint-fix backend   # solo backend
/lint-fix frontend  # solo frontend
```

## Steps

### Backend

```powershell
Set-Location C:\Users\Usuario\Proyectos\truck-manager\backend

# Check only (sin modificar archivos)
npm run lint -- --max-warnings 0

# Auto-fix (modifica archivos)
npm run lint

# Format con Prettier
npm run format
```

Scripts disponibles en `backend/package.json`:
- `lint` → `eslint "{src,apps,libs,test}/**/*.ts" --fix`
- `format` → `prettier --write "src/**/*.ts" "test/**/*.ts"`

### Frontend

```powershell
Set-Location C:\Users\Usuario\Proyectos\truck-manager\frontend

# Check only
npm run lint

# Format con Prettier
npm run format
```

Scripts disponibles en `frontend/package.json`:
- `lint` → `eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0`
- `format` → `prettier --write "src/**/*.{ts,tsx}"`

### Ambos (secuencial)

```powershell
Set-Location C:\Users\Usuario\Proyectos\truck-manager\backend; npm run lint; npm run format
Set-Location C:\Users\Usuario\Proyectos\truck-manager\frontend; npm run lint; npm run format
```

## Interpreting output

| Output | Meaning |
|--------|---------|
| No output / exit 0 | Todo ok |
| `X problems (Y errors, Z warnings)` | Hay errores que requieren corrección manual |
| `prettier --write` output con lista de archivos | Archivos reformateados |

## Common issues

- **`Parsing error: Cannot find module '...'`** → problema de tsconfig, no de lint
- **`'X' is defined but never used`** → prefijear variable con `_` si es intencional, o eliminarla
- **`@typescript-eslint/no-explicit-any`** → reemplazar `any` con el tipo correcto o usar `unknown`
- Prettier y ESLint pueden entrar en conflicto en indentación — el proyecto tiene `prettier` como plugin de ESLint, correr ambos en el mismo orden (lint después de format) resuelve el conflicto
