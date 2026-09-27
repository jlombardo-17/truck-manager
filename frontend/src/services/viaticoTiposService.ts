import axios, { AxiosInstance } from 'axios';
import { CreateViaticoTipoDto, UpdateViaticoTipoDto, ViaticoTipo } from '../types/jornada';
import authService from './authService';
import { normalizeArrayResponse, normalizeObjectResponse } from './responseNormalizer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ViaticoTiposService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use((config) => {
      const token = authService.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getAll(incluirInactivos = false): Promise<ViaticoTipo[]> {
    const response = await this.api.get<unknown>('/viatico-tipos', {
      params: incluirInactivos ? { todos: 'true' } : undefined,
    });
    return normalizeArrayResponse<ViaticoTipo>(response.data);
  }

  async create(dto: CreateViaticoTipoDto): Promise<ViaticoTipo> {
    const response = await this.api.post<unknown>('/viatico-tipos', dto);
    return normalizeObjectResponse<ViaticoTipo>(response.data);
  }

  async update(id: number, dto: UpdateViaticoTipoDto): Promise<ViaticoTipo> {
    const response = await this.api.put<unknown>(`/viatico-tipos/${id}`, dto);
    return normalizeObjectResponse<ViaticoTipo>(response.data);
  }
}

export const viaticoTiposService = new ViaticoTiposService();

export default viaticoTiposService;
