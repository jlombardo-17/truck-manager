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
}

export default new DocumentosService();
