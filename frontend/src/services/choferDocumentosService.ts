import axios from 'axios';
import { ChoferDocumento, EstadoDocumento } from '../types/chofer-documento';
import { normalizeArrayResponse, normalizeObjectResponse } from './responseNormalizer';
import { getDaysUntil } from '../utils/dateUtils';

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const choferDocumentosService = {
  async getByChoferId(choferId: number): Promise<ChoferDocumento[]> {
    const response = await api.get<unknown>(`/choferes-documentos/chofer/${choferId}`);
    return normalizeArrayResponse<ChoferDocumento>(response.data, 'documentos');
  },

  async getById(documentoId: number): Promise<ChoferDocumento> {
    const response = await api.get<unknown>(`/choferes-documentos/${documentoId}`);
    return normalizeObjectResponse<ChoferDocumento>(response.data, 'documento');
  },

  async create(documento: Partial<ChoferDocumento>): Promise<ChoferDocumento> {
    const response = await api.post(`/choferes-documentos`, documento);
    return response.data;
  },

  async update(documentoId: number, documento: Partial<ChoferDocumento>): Promise<ChoferDocumento> {
    const response = await api.put(`/choferes-documentos/${documentoId}`, documento);
    return response.data;
  },

  async delete(documentoId: number): Promise<void> {
    await api.delete(`/choferes-documentos/${documentoId}`);
  },

  async getProximosAVencer(dias: number = 30): Promise<ChoferDocumento[]> {
    const response = await api.get<unknown>(`/choferes-documentos/alertas/proximos-vencer?dias=${dias}`);
    return normalizeArrayResponse<ChoferDocumento>(response.data, 'documentos');
  },

  async getVencidos(): Promise<ChoferDocumento[]> {
    const response = await api.get<unknown>(`/choferes-documentos/alertas/vencidos`);
    return normalizeArrayResponse<ChoferDocumento>(response.data, 'documentos');
  },

  /**
   * Calcula el estado de un documento basándose en su fecha de vencimiento
   */
  getEstadoDocumento(documento: ChoferDocumento): EstadoDocumento {
    if (!documento.fechaVencimiento) {
      return 'sin_vencimiento';
    }

    const diasRestantes = getDaysUntil(documento.fechaVencimiento) as number;

    if (diasRestantes < 0) {
      return 'vencido';
    } else if (diasRestantes <= 30) {
      return 'proximo_vencer';
    } else {
      return 'vigente';
    }
  },

  /**
   * Calcula los días restantes hasta el vencimiento
   */
  getDiasRestantes(fechaVencimiento: Date | string | null): number | null {
    if (!fechaVencimiento) {
      return null;
    }

    return getDaysUntil(fechaVencimiento);
  },
};

export default choferDocumentosService;
