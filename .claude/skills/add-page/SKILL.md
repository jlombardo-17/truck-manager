---
description: Scaffold a new React frontend page with Axios service and TypeScript types following truck-manager patterns
---

# Add Frontend Page

Creates a new page, its Axios service, and its TypeScript types. Wires the route into the router.

## Usage

```
/add-page <Nombre>
```

Example: `/add-page Incidente` → creates `Incidentes.tsx`, `incidentesService.ts`, `incidente.ts` types.

## Steps

### 1. Determine names

From the argument `<Nombre>` (PascalCase, Spanish):
- **Page file:** `frontend/src/pages/<Nombre>s.tsx` (plural)
- **Service file:** `frontend/src/services/<nombre>sService.ts` (camelCase plural)
- **Types file:** `frontend/src/types/<nombre>.ts` (camelCase singular)
- **API route:** `/<nombre>s` (matches the backend controller)

### 2. Create types file

`frontend/src/types/<nombre>.ts`

```typescript
export interface <Nombre> {
  id: number;
  // TODO: campos del dominio
  descripcion: string;
  createdAt: string;
  updatedAt: string;
}

export interface Create<Nombre>Dto {
  // TODO: campos requeridos para crear
  descripcion: string;
}

export interface Update<Nombre>Dto {
  // TODO: todos opcionales
  descripcion?: string;
}
```

### 3. Create service file

`frontend/src/services/<nombre>sService.ts`

```typescript
import axios, { AxiosInstance } from 'axios';
import authService from './authService';
import { normalizeArrayResponse, normalizeObjectResponse } from './responseNormalizer';
import { <Nombre>, Create<Nombre>Dto, Update<Nombre>Dto } from '../types/<nombre>';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class <Nombre>sService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.api.interceptors.request.use((config) => {
      const token = authService.getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async getAll(): Promise<<Nombre>[]> {
    try {
      const response = await this.api.get<unknown>('/<nombre>s');
      return normalizeArrayResponse<<Nombre>>(response.data, '<nombre>s');
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async getById(id: number): Promise<<Nombre>> {
    try {
      const response = await this.api.get<unknown>(`/<nombre>s/${id}`);
      return normalizeObjectResponse<<Nombre>>(response.data, '<nombre>');
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async create(data: Create<Nombre>Dto): Promise<<Nombre>> {
    try {
      const response = await this.api.post<<Nombre>>('/<nombre>s', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async update(id: number, data: Update<Nombre>Dto): Promise<<Nombre>> {
    try {
      const response = await this.api.patch<<Nombre>>(`/<nombre>s/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async delete(id: number): Promise<{ message: string }> {
    try {
      const response = await this.api.delete<{ message: string }>(`/<nombre>s/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }
}

export default new <Nombre>sService();
```

### 4. Create page file

`frontend/src/pages/<Nombre>s.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import <nombre>sService from '../services/<nombre>sService';
import { <Nombre> } from '../types/<nombre>';
import BackButton from '../components/BackButton';
import HeroSection from '../components/HeroSection';

const <Nombre>s: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [<nombre>s, set<Nombre>s] = useState<<Nombre>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    load<Nombre>s();
  }, []);

  const load<Nombre>s = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await <nombre>sService.getAll();
      set<Nombre>s(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar <nombre>s');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;
    try {
      await <nombre>sService.delete(id);
      load<Nombre>s();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-content">
          <h1 className="navbar-title" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            Truck Manager
          </h1>
          <div className="navbar-user">
            <span className="user-name">{user?.firstName} {user?.lastName}</span>
            <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>
          </div>
        </div>
      </nav>

      <div style={{ padding: '24px' }}>
        <BackButton label="Volver al Dashboard" to="/dashboard" />

        <HeroSection
          subtitle="Gestión"
          title="<Nombre>s"
          description="Administración de <nombre>s."
          primaryAction={{ label: '+ Nuevo', onClick: () => navigate('/<nombre>s/new') }}
        />

        {error && <div className="error-message">{error}</div>}

        {isLoading ? (
          <p>Cargando...</p>
        ) : <nombre>s.length === 0 ? (
          <p>No hay registros.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                {/* TODO: agregar columnas */}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {<nombre>s.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  {/* TODO: agregar celdas */}
                  <td>
                    <button onClick={() => navigate(`/<nombre>s/${item.id}`)}>Ver</button>
                    <button onClick={() => handleDelete(item.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default <Nombre>s;
```

### 5. Wire the route

In `frontend/src/App.tsx` (o donde estén definidas las rutas), agregar dentro de las rutas protegidas:

```tsx
import <Nombre>s from './pages/<Nombre>s';
// ...
<Route path="/<nombre>s" element={<ProtectedRoute><Nombre>s /></ProtectedRoute>} />
```

### 6. Add link in Dashboard (opcional)

Si la nueva página necesita acceso desde el dashboard, agregar una card en `frontend/src/pages/Dashboard.tsx` o en el componente `DashboardQuickAccess.tsx`.

## Notes

- Usar `normalizeArrayResponse` para listas y `normalizeObjectResponse` para objetos individuales — estos manejan respuestas envueltas `{ data: [...] }` vs arrays directos.
- Usar funciones de `utils/dateUtils.ts` para cualquier campo fecha en formularios (`toDateInputValue`, `getTodayLocalInputValue`).
- El interceptor del servicio agrega el JWT automáticamente — no hay que manejarlo en el componente.
