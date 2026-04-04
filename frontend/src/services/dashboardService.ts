import axios from 'axios';
import authService from './authService';
import { normalizeArrayResponse, normalizeObjectResponse } from './responseNormalizer';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const DASHBOARD_BASE_PATH = API_BASE_URL.endsWith('/api')
  ? `${API_BASE_URL}/dashboard`
  : `${API_BASE_URL}/api/dashboard`;

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
    const url = queryString
      ? `${DASHBOARD_BASE_PATH}/resumen?${queryString}`
      : `${DASHBOARD_BASE_PATH}/resumen`;
    
    const response = await axios.get<unknown>(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = normalizeObjectResponse<Partial<DashboardResumen>>(response.data);
    return {
      ingresosDelMes: Number(payload.ingresosDelMes) || 0,
      gastosDelMes: Number(payload.gastosDelMes) || 0,
      gananciaNetaDelMes: Number(payload.gananciaNetaDelMes) || 0,
      camionesActivos: Number(payload.camionesActivos) || 0,
      viajesCompletados: Number(payload.viajesCompletados) || 0,
      detalleGastosDelMes: {
        operativosViaje: Number(payload.detalleGastosDelMes?.operativosViaje) || 0,
        sueldos: Number(payload.detalleGastosDelMes?.sueldos) || 0,
        mantenimiento: Number(payload.detalleGastosDelMes?.mantenimiento) || 0,
        documentosFijos: Number(payload.detalleGastosDelMes?.documentosFijos) || 0,
      },
      mantenimientoPendiente: normalizeArrayResponse(payload.mantenimientoPendiente, 'mantenimientoPendiente'),
      documentosPorVencer: normalizeArrayResponse(payload.documentosPorVencer, 'documentosPorVencer'),
    };
  },

  async getDesempenoCamiones(fechaInicio?: string, fechaFin?: string): Promise<DesempenoCamion[]> {
    const token = authService.getToken();
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const queryString = params.toString();
    const url = queryString
      ? `${DASHBOARD_BASE_PATH}/camiones?${queryString}`
      : `${DASHBOARD_BASE_PATH}/camiones`;
    
    const response = await axios.get<unknown>(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return normalizeArrayResponse<DesempenoCamion>(response.data, 'camiones');
  },

  async getDesempenoChoferes(fechaInicio?: string, fechaFin?: string): Promise<DesempenoChofer[]> {
    const token = authService.getToken();
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const queryString = params.toString();
    const url = queryString
      ? `${DASHBOARD_BASE_PATH}/choferes?${queryString}`
      : `${DASHBOARD_BASE_PATH}/choferes`;
    
    const response = await axios.get<unknown>(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return normalizeArrayResponse<DesempenoChofer>(response.data, 'choferes');
  },
};
