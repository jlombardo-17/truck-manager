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
  async getResumen(fechaInicio?: string, fechaFin?: string): Promise<DashboardResumen> {
    const token = authService.getToken();
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const queryString = params.toString();
    const url = queryString ? `${API_BASE_URL}/api/dashboard/resumen?${queryString}` : `${API_BASE_URL}/api/dashboard/resumen`;
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getDesempenoCamiones(fechaInicio?: string, fechaFin?: string): Promise<DesempenoCamion[]> {
    const token = authService.getToken();
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const queryString = params.toString();
    const url = queryString ? `${API_BASE_URL}/api/dashboard/camiones?${queryString}` : `${API_BASE_URL}/api/dashboard/camiones`;
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getDesempenoChoferes(fechaInicio?: string, fechaFin?: string): Promise<DesempenoChofer[]> {
    const token = authService.getToken();
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const queryString = params.toString();
    const url = queryString ? `${API_BASE_URL}/api/dashboard/choferes?${queryString}` : `${API_BASE_URL}/api/dashboard/choferes`;
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
