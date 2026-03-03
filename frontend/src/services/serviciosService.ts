import axios, { AxiosInstance } from 'axios';
import { Servicio, CreateServicioDto } from '../types/servicio';
import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class ServiciosService {
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

  async getByCamion(camionId: number): Promise<Servicio[]> {
    try {
      const response = await this.api.get<Servicio[]>(`/camiones/${camionId}/servicios`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async getById(servicioId: number, camionId: number): Promise<Servicio> {
    try {
      const response = await this.api.get<Servicio>(`/camiones/${camionId}/servicios/${servicioId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async create(camionId: number, data: CreateServicioDto): Promise<Servicio> {
    try {
      const response = await this.api.post<Servicio>(`/camiones/${camionId}/servicios`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async update(servicioId: number, camionId: number, data: Partial<CreateServicioDto>): Promise<Servicio> {
    try {
      const response = await this.api.put<Servicio>(`/camiones/${camionId}/servicios/${servicioId}`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async delete(servicioId: number, camionId: number): Promise<{ message: string }> {
    try {
      const response = await this.api.delete<{ message: string }>(`/camiones/${camionId}/servicios/${servicioId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }
}

export default new ServiciosService();
