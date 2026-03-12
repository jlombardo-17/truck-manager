import { MantenimientoTipo, MantenimientoRegistro } from '../types/mantenimiento';
import authService from './authService';

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${authService.getToken()}`,
});

export const maintenanceService = {
  // ============ Tipos de Mantenimiento ============
  
  async getAllTipos(): Promise<MantenimientoTipo[]> {
    const response = await fetch(`${API_URL}/mantenimiento/tipos`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching maintenance types');
    return response.json();
  },

  async getTipoById(id: number): Promise<MantenimientoTipo> {
    const response = await fetch(`${API_URL}/mantenimiento/tipos/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching maintenance type');
    return response.json();
  },

  async createTipo(data: Omit<MantenimientoTipo, 'id' | 'createdAt' | 'updatedAt'>): Promise<MantenimientoTipo> {
    const response = await fetch(`${API_URL}/mantenimiento/tipos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error creating maintenance type');
    return response.json();
  },

  async updateTipo(id: number, data: Partial<MantenimientoTipo>): Promise<MantenimientoTipo> {
    const response = await fetch(`${API_URL}/mantenimiento/tipos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error updating maintenance type');
    return response.json();
  },

  async deleteTipo(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/mantenimiento/tipos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error deleting maintenance type');
  },

  // ============ Registros de Mantenimiento ============

  async getRegistrosByCamion(camionId: number): Promise<MantenimientoRegistro[]> {
    const response = await fetch(`${API_URL}/mantenimiento/camion/${camionId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching maintenance records');
    return response.json();
  },

  async getRegistroById(id: number): Promise<MantenimientoRegistro> {
    const response = await fetch(`${API_URL}/mantenimiento/registro/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching maintenance record');
    return response.json();
  },

  async createRegistro(data: Omit<MantenimientoRegistro, 'id' | 'createdAt' | 'updatedAt'>): Promise<MantenimientoRegistro> {
    const response = await fetch(`${API_URL}/mantenimiento/registro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error creating maintenance record');
    return response.json();
  },

  async updateRegistro(id: number, data: Partial<MantenimientoRegistro>): Promise<MantenimientoRegistro> {
    const response = await fetch(`${API_URL}/mantenimiento/registro/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error updating maintenance record');
    return response.json();
  },

  async deleteRegistro(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/mantenimiento/registro/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error deleting maintenance record');
  },

  async marcarComoCompletado(
    id: number,
    costoReal?: number,
    observaciones?: string
  ): Promise<MantenimientoRegistro> {
    const response = await fetch(`${API_URL}/mantenimiento/registro/${id}/completar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ costoReal, observaciones }),
    });
    if (!response.ok) throw new Error('Error marking maintenance as completed');
    return response.json();
  },

  // ============ Alertas ============

  async getProximosAVencer(camionId?: number, dias: number = 30): Promise<MantenimientoRegistro[]> {
    let url = `${API_URL}/mantenimiento/alertas/proximos-vencer?dias=${dias}`;
    if (camionId) url += `&camionId=${camionId}`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching upcoming maintenance');
    return response.json();
  },

  async getVencidos(camionId?: number): Promise<MantenimientoRegistro[]> {
    let url = `${API_URL}/mantenimiento/alertas/vencidos`;
    if (camionId) url += `?camionId=${camionId}`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching overdue maintenance');
    return response.json();
  },

  // ============ Estadísticas ============

  async getEstadisticasCamion(camionId: number): Promise<{
    totalRegistros: number;
    completados: number;
    pendientes: number;
    vencidos: number;
    proximosVencer: number;
    costoTotal: number;
  }> {
    const response = await fetch(`${API_URL}/mantenimiento/estadisticas/camion/${camionId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error fetching maintenance statistics');
    return response.json();
  },
};
