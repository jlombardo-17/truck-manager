import axios, { AxiosInstance } from 'axios';
import { GastoFijo, CreateGastoFijoDto, UpdateGastoFijoDto } from '../types/gastoFijo';
import authService from './authService';
import { normalizeArrayResponse } from './responseNormalizer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class GastosFijosService {
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

  async getByCamion(camionId: number): Promise<GastoFijo[]> {
    try {
      const response = await this.api.get<unknown>(`/camiones/${camionId}/gastos-fijos`);
      return normalizeArrayResponse<GastoFijo>(response.data, 'gastosFijos');
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async create(camionId: number, data: CreateGastoFijoDto): Promise<GastoFijo> {
    try {
      const response = await this.api.post<GastoFijo>(`/camiones/${camionId}/gastos-fijos`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async update(gastoFijoId: number, camionId: number, data: UpdateGastoFijoDto): Promise<GastoFijo> {
    try {
      const response = await this.api.put<GastoFijo>(`/camiones/${camionId}/gastos-fijos/${gastoFijoId}`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async delete(gastoFijoId: number, camionId: number): Promise<{ message: string }> {
    try {
      const response = await this.api.delete<{ message: string }>(`/camiones/${camionId}/gastos-fijos/${gastoFijoId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }
}

export default new GastosFijosService();
