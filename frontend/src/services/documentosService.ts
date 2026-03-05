import axios, { AxiosInstance } from 'axios';
import { Documento, CreateDocumentoDto } from '../types/servicio';
import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class DocumentosService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar token automáticamente
    this.api.interceptors.request.use((config) => {
      const token = authService.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getByCamion(camionId: number): Promise<Documento[]> {
    try {
      const response = await this.api.get<Documento[]>(`/camiones/${camionId}/documentos`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async getById(documentoId: number, camionId: number): Promise<Documento> {
    try {
      const response = await this.api.get<Documento>(`/camiones/${camionId}/documentos/${documentoId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async create(camionId: number, data: CreateDocumentoDto): Promise<Documento> {
    try {
      const response = await this.api.post<Documento>(`/camiones/${camionId}/documentos`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async update(documentoId: number, camionId: number, data: Partial<CreateDocumentoDto>): Promise<Documento> {
    try {
      const response = await this.api.put<Documento>(`/camiones/${camionId}/documentos/${documentoId}`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async delete(documentoId: number, camionId: number): Promise<{ message: string }> {
    try {
      const response = await this.api.delete<{ message: string }>(`/camiones/${camionId}/documentos/${documentoId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async getProximosAVencer(dias: number = 30): Promise<Documento[]> {
    try {
      const response = await this.api.get<Documento[]>(`/documentos-camiones/proximos-vencer?dias=${dias}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async getVencidos(): Promise<Documento[]> {
    try {
      const response = await this.api.get<Documento[]>(`/documentos-camiones/vencidos`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  /**
   * Calcula el estado de un documento basándose en su fecha de vencimiento
   */
  getEstadoDocumento(documento: Documento): 'vigente' | 'proximo_vencer' | 'vencido' | 'sin_vencimiento' {
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
  }

  /**
   * Calcula los días restantes hasta el vencimiento
   */
  getDiasRestantes(documento: Documento): number | null {
    if (!documento.fechaVencimiento) {
      return null;
    }

    const hoy = new Date();
    const fechaVencimiento = new Date(documento.fechaVencimiento);
    return Math.floor((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }
}

export default new DocumentosService();
