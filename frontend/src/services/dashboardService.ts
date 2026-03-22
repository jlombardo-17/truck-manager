import axios from 'axios';
import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface DashboardResumen {
  ingresosDelMes: number;
  gastosDelMes: number;
  gananciaNetaDelMes: number;
  camionesActivos: number;
  viajesCompletados: number;
  detalleGastosDelMes: {
    operativosViaje: number;
    sueldos: number;
    mantenimiento: number;
    documentosFijos: number;
  };
  mantenimientoPendiente: Array<{
    camionPlaca: string;
    tipo: string;
    proximoVencimiento: Date;
  }>;
  documentosPorVencer: Array<{
    choferNombre: string;
    documentoTipo: string;
    diasRestantes: number;
  }>;
}

export interface DesempenoCamion {
  id: number;
  patente: string;
  ingresos: number;
  gastos: number;
  eficiencia: number;
  kmRecorridos: number;
  viajesCompletos: number;
}

export interface DesempenoChofer {
  id: number;
  nombre: string;
  viajesCompletos: number;
  ingresos: number;
  comisiones: number;
  puntualidad: number;
}

export const dashboardService = {
  async getResumen(): Promise<DashboardResumen> {
    const token = authService.getToken();
    const response = await axios.get(
      `${API_BASE_URL}/api/dashboard/resumen`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async getDesempenoCamiones(): Promise<DesempenoCamion[]> {
    const token = authService.getToken();
    const response = await axios.get(
      `${API_BASE_URL}/api/dashboard/camiones`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async getDesempenoChoferes(): Promise<DesempenoChofer[]> {
    const token = authService.getToken();
    const response = await axios.get(
      `${API_BASE_URL}/api/dashboard/choferes`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
};
