import axios, { AxiosInstance } from 'axios';
import authService from './authService';
import { ConfiguracionVehicular, UpsertConfiguracionVehicularDto } from '../types/configuracionVehicular';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ConfiguracionVehicularService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.api.interceptors.request.use((config) => {
      const token = authService.getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async getByCamion(camionId: number): Promise<ConfiguracionVehicular | null> {
    const res = await this.api.get<ConfiguracionVehicular | null>(
      `/camiones/${camionId}/configuracion`,
    );
    return res.data || null;
  }

  async upsert(
    camionId: number,
    dto: UpsertConfiguracionVehicularDto,
  ): Promise<ConfiguracionVehicular> {
    const res = await this.api.put<ConfiguracionVehicular>(
      `/camiones/${camionId}/configuracion`,
      dto,
    );
    return res.data;
  }

  async remove(camionId: number): Promise<void> {
    await this.api.delete(`/camiones/${camionId}/configuracion`);
  }
}

export const configuracionVehicularService = new ConfiguracionVehicularService();
