import axios from 'axios';
import { Chofer, CreateChoferDto, UpdateChoferDto } from '../types/chofer';
import authService from './authService';

const API_URL = 'http://localhost:3000';

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
    const response = await axiosInstance.get<Chofer[]>('/choferes');
    return response.data;
  }

  async getById(id: number): Promise<Chofer> {
    const response = await axiosInstance.get<Chofer>(`/choferes/${id}`);
    return response.data;
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
