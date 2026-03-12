import axios, { AxiosInstance } from 'axios';
import authService from './authService';
import { Repostada, CreateRepostadaDto, Estadisticas } from '../types/repostada';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class RepostadasService {
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

  async getByCamion(camionId: number): Promise<Repostada[]> {
    try {
      const response = await this.api.get<Repostada[]>(`/camiones/${camionId}/repostadas`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async getById(camionId: number, id: number): Promise<Repostada> {
    try {
      const response = await this.api.get<Repostada>(`/camiones/${camionId}/repostadas/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async getEstadisticas(camionId: number): Promise<Estadisticas> {
    try {
      const response = await this.api.get<Estadisticas>(
        `/camiones/${camionId}/repostadas/estadisticas`
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async create(camionId: number, data: CreateRepostadaDto): Promise<Repostada> {
    try {
      const response = await this.api.post<Repostada>(`/camiones/${camionId}/repostadas`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async update(
    camionId: number,
    id: number,
    data: Partial<CreateRepostadaDto>
  ): Promise<Repostada> {
    try {
      const response = await this.api.put<Repostada>(
        `/camiones/${camionId}/repostadas/${id}`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async delete(camionId: number, id: number): Promise<void> {
    try {
      await this.api.delete(`/camiones/${camionId}/repostadas/${id}`);
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }
}

export const repostadasService = new RepostadasService();
