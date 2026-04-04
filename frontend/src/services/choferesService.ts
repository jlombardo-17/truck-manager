import axios from 'axios';
import { Chofer, CreateChoferDto, UpdateChoferDto } from '../types/chofer';
import authService from './authService';
import { normalizeArrayResponse, normalizeObjectResponse } from './responseNormalizer';

const API_URL = '/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Interceptor para agregar el token JWT
axiosInstance.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

class ChoferesService {
  async getAll(): Promise<Chofer[]> {
    const response = await axiosInstance.get<unknown>('/choferes');
    return normalizeArrayResponse<Chofer>(response.data, 'choferes');
  }

  async getById(id: number): Promise<Chofer> {
    const response = await axiosInstance.get<unknown>(`/choferes/${id}`);
    return normalizeObjectResponse<Chofer>(response.data, 'chofer');
  }

  async create(data: CreateChoferDto): Promise<Chofer> {
    const response = await axiosInstance.post<Chofer>('/choferes', data);
    return response.data;
  }

  async update(id: number, data: UpdateChoferDto): Promise<Chofer> {
    const response = await axiosInstance.put<Chofer>(`/choferes/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/choferes/${id}`);
  }
}

export default new ChoferesService();
