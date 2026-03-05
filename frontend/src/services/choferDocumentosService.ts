import axios from 'axios';
import { ChoferDocumento, EstadoDocumento } from '../types/chofer-documento';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const choferDocumentosService = {
  async getByChoferId(choferId: number): Promise<ChoferDocumento[]> {
    const response = await api.get(`/choferes/${choferId}/documentos`);
    return response.data;
  },

  async getById(choferId: number, documentoId: number): Promise<ChoferDocumento> {
    const response = await api.get(`/choferes/${choferId}/documentos/${documentoId}`);
    return response.data;
  },

  async create(choferId: number, documento: Partial<ChoferDocumento>): Promise<ChoferDocumento> {
    const response = await api.post(`/choferes/${choferId}/documentos`, documento);
    return response.data;
  },

  async update(choferId: number, documentoId: number, documento: Partial<ChoferDocumento>): Promise<ChoferDocumento> {
    const response = await api.put(`/choferes/${choferId}/documentos/${documentoId}`, documento);
    return response.data;
  },

  async delete(choferId: number, documentoId: number): Promise<void> {
    await api.delete(`/choferes/${choferId}/documentos/${documentoId}`);
  },

  async getProximosAVencer(dias: number = 30): Promise<ChoferDocumento[]> {
    const response = await api.get(`/documentos/proximos-vencer?dias=${dias}`);
    return response.data;
  },

  async getVencidos(): Promise<ChoferDocumento[]> {
    const response = await api.get(`/documentos/vencidos`);
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
  getDiasRestantes(documento: ChoferDocumento): number | null {
    if (!documento.fechaVencimiento) {
      return null;
    }

    const hoy = new Date();
    const fechaVencimiento = new Date(documento.fechaVencimiento);
    return Math.floor((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  },
};

export default choferDocumentosService;
