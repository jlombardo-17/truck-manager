import axios, { AxiosInstance } from 'axios';
import { Camion, CreateCamionDto, UpdateCamionDto } from '../types/camion';
import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class CamionesService {
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

  async getAll(): Promise<Camion[]> {
    try {
      const response = await this.api.get<Camion[]>('/camiones');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async getById(id: number): Promise<Camion> {
    try {
      const response = await this.api.get<Camion>(`/camiones/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async create(data: CreateCamionDto): Promise<Camion> {
    try {
      const response = await this.api.post<Camion>('/camiones', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async update(id: number, data: UpdateCamionDto): Promise<Camion> {
    try {
      const response = await this.api.patch<Camion>(`/camiones/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async delete(id: number): Promise<{ message: string }> {
    try {
      const response = await this.api.delete<{ message: string }>(`/camiones/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }
}

export default new CamionesService();
