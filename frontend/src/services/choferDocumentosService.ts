import axios from 'axios';
import { ChoferDocumento, EstadoDocumento } from '../types/chofer-documento';

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
    const response = await api.get(`/choferes-documentos/chofer/${choferId}`);
    return response.data;
  },

  async getById(documentoId: number): Promise<ChoferDocumento> {
    const response = await api.get(`/choferes-documentos/${documentoId}`);
    return response.data;
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
    const response = await api.get(`/choferes-documentos/alertas/proximos-vencer?dias=${dias}`);
    return response.data;
  },

  async getVencidos(): Promise<ChoferDocumento[]> {
    const response = await api.get(`/choferes-documentos/alertas/vencidos`);
    return response.data;
  },

  /**
   * Calcula el estado de un documento basándose en su fecha de vencimiento
   */
  getEstadoDocumento(documento: ChoferDocumento): EstadoDocumento {
    if (!documento.fechaVencimiento) {
      return 'sin_vencimiento';
    }

    const hoy = new Date();
    const fechaVencimiento = new Date(documento.fechaVencimiento);
    const diasRestantes = Math.floor((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

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

    const hoy = new Date();
    const fecha = new Date(fechaVencimiento);
    return Math.floor((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  },
};

export default choferDocumentosService;
